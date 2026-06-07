# Arquitectura Funcional Detallada del Sistema "Mixo"

Mixo es una aplicación web complementaria diseñada bajo el paradigma de **bloques de construcción ("Lego")**, ultra-enfocada en resolver la operación de cocina, el registro ágil de facturas de compra y la estandarización operativa en restaurantes. 

Esta arquitectura está optimizada bajo la filosofía **Offline-First** (Local-First) y diseñada para integrarse de forma transparente con el sistema central **Unify**, delegando en este último todo el análisis estratégico, dashboards financieros y simulaciones de desviación de costos.

---

## 1. Mapa General del Ecosistema (Mixo ◄► Unify)

Mixo actúa como el capturador de datos en caliente en el restaurante (almacenando en IndexedDB), sincronizando asíncronamente con **Supabase (PostgreSQL)** en la nube, el cual expone instantáneamente APIs REST seguras para que **Unify** consuma y procese las analíticas:

```
┌────────────────────────────────────────────────────────┐
│                        MIXO APP                        │
│ (Operación local en PC, cocina y compras -> IndexedDB) │
└───────────────────────────┬────────────────────────────┘
                            │ (Sincronización Asíncrona)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  SUPABASE CLOUD (SQL)                  │
│    (Base de datos PostgreSQL relacional con RLS)       │
└───────────────────────────┬────────────────────────────┘
                            │ (Consumo API REST nativa)
                            ▼
┌────────────────────────────────────────────────────────┐
│                       UNIFY PLATFORM                   │
│   (Dashboard analítico, alertas de variación, BI)      │
└───────────────────────────┬────────────────────────────┘
```

---

## 2. Especificación Detallada de los Módulos ("Lego Bricks")

### MÓDULO 1: Catálogo de Ingredientes, Categorías y Costos Base
Administrado por el Chef y actualizado automáticamente a nivel financiero por el módulo de Compras.

*   **Gestión de Categorías Personalizadas (Tabla: `categorias`):**
    *   `id` (UUID - Primary Key).
    *   `nombre` (VARCHAR - Unique): ej. "Verduras", "Empaques", "Carnes".
    *   `descripcion` (TEXT, Opcional).
*   **Atributos de Ingrediente (Tabla: `ingredientes`):**
    *   `id` (UUID - Primary Key).
    *   `nombre` (VARCHAR): ej. "Cebolla Cabezona Roja".
    *   `categoria_id` (UUID - Foreign Key -> `categorias.id`): **Vínculo Relacional.** Permite estructurar insumos bajo categorías dinámicas creadas por el usuario.
    *   `unidad_compra` (VARCHAR): ej. `kg`, `litro`, `unidad`.
    *   `unidad_receta` (VARCHAR): ej. `g`, `ml`, `unidad`.
    *   `factor_conversion` (NUMERIC): Cantidad de unidades de receta en una unidad de compra. Ej: `1000` para kg -> g.
    *   `factor_densidad` (NUMERIC, Opcional): **Factor de la vida real.** Si el ingrediente se compra por peso (`kg`) pero se usa en recetas por volumen (`ml`), representa los gramos por mililitro (ej. miel `1.4` g/ml).
    *   `rendimiento_porcentaje` (NUMERIC): Porcentaje comestible real (**Yield %**) tras limpieza/merma. ej: `85.0` (se pierde el 15%).
    *   `precio_activo` (NUMERIC): Costo base del insumo.
*   **Fórmulas Matemáticas de Costeo (Materia Prima Directa - MPD):**
    *   **Costo Unitario Bruto (AP - As Purchased):**
        *   *Si NO requiere conversión de densidad:*
            $$\text{Costo AP por Gramo/Mililitro} = \frac{\text{precio\_activo}}{\text{factor\_conversion}}$$
        *   *Si requiere conversión por densidad (de kg a ml):*
            $$\text{Costo AP por Mililitro} = \frac{\text{precio\_activo}}{\text{factor\_conversion}} \times \text{factor\_densidad}$$
    *   **Costo Unitario Neto Real (EP - Edible Portion):** Cuenta la merma física del ingrediente en crudo.
        $$\text{Costo EP} = \frac{\text{Costo AP}}{\left(\frac{\text{rendimiento\_porcentaje}}{100}\right)}$$
*   **Estrategia de Costeo para la Fase 1 (Sin Inventario de Stock Físico):**
    Dado que el control de existencias en bodega (stock físico en tiempo real) se implementará en la **Fase 2**, no es posible calcular matemáticamente el Costo Promedio Ponderado (CPP) tradicional en esta fase inicial. 
    *   *Resolución:* En la Fase 1, el `precio_activo` del ingrediente se actualizará automáticamente con el **último precio de compra registrado en facturas**. Mixo mantendrá el registro lineal histórico en series de tiempo para que **Unify** pueda realizar proyecciones financieras complejas.

---

### MÓDULO 2: Recetas y Estandarización de Preparación (Fichas Técnicas)
El recetario no solo calcula costos, sino que sirve como el manual operativo de la cocina para estandarizar procesos.

*   **La Ficha de la Receta (Tabla: `recetas`):**
    *   `id` (UUID - Primary Key).
    *   `nombre` (VARCHAR): ej. "Salsa Boloñesa Base".
    *   `es_sub_receta` (BOOLEAN): Si es verdadera, esta receta puede anidarse dentro de otras.
    *   `codigo_integracion_pos` (VARCHAR, Opcional): **SKU del POS para Unify.** Llave de cruce clave para cruzar costos de Mixo con ventas del POS.
    *   `unidad_rendimiento` (VARCHAR): `kg`, `litro`, `porciones`.
    *   `cantidad_rendimiento` (NUMERIC): Cuánto rinde el lote cocinado (Ej: rinde `5` `kg`).
    *   `vida_util_horas` (INTEGER, Opcional): Horas máximas de almacenamiento antes de desperdicio.
    *   `temperatura_almacenado` (VARCHAR, Opcional): ej. "Refrigerado (2°C - 4°C)".
    *   `alergenos` (VARCHAR[]): Array de alérgenos identificados (gluten, lactosa, etc.).
*   **Ingredientes de la Receta (Tabla: `receta_ingredientes` - Tabla de rompimiento relacional):**
    *   `receta_id` (UUID - Foreign Key -> `recetas.id`, ON DELETE CASCADE).
    *   `ingrediente_id` (UUID, Opcional - Foreign Key -> `ingredientes.id`).
    *   `sub_receta_id` (UUID, Opcional - Foreign Key -> `recetas.id`).
    *   `cantidad_requerida` (NUMERIC): Cantidad neta requerida en la unidad de receta (g, ml, u).
*   **Preparación Paso a Paso (Tabla: `receta_pasos`):**
    *   `id` (UUID - Primary Key).
    *   `receta_id` (UUID - Foreign Key -> `recetas.id`, ON DELETE CASCADE).
    *   `numero_paso` (INTEGER): Secuencial.
    *   `estacion` (VARCHAR): `preparacion_fria`, `estufa`, `parrilla`, `horno`, `emplatado`.
    *   `descripcion` (TEXT): Instrucciones.
    *   `tiempo_minutos` (INTEGER): Duración.
    *   `temperatura_objetivo` (NUMERIC, Opcional).
    *   `ingredientes_asociados` (UUID[]): Array de IDs de ingredientes usados en este paso.

---

### MÓDULO 3: Proveedores, Registro de Compras y Mermas Operativas
Diseñado para la digitación ultra-rápida en la PC de oficina por parte del Administrador. **No muestra advertencias de costos ni popups disruptivos para garantizar la máxima velocidad de entrada.**

*   **Directorio de Proveedores (Tabla: `proveedores`):**
    *   `id` (UUID - Primary Key).
    *   `nombre_comercial` (VARCHAR).
    *   `nit` (VARCHAR).
    *   `contacto_nombre` (VARCHAR), `telefono` (VARCHAR), `correo` (VARCHAR).
*   **Registro de Facturas (Tabla: `compras_facturas`):**
    *   `id` (UUID - Primary Key).
    *   `factura_numero` (VARCHAR).
    *   `proveedor_id` (UUID - Foreign Key -> `proveedores.id`).
    *   `fecha_compra` (TIMESTAMP).
    *   `registrado_por` (VARCHAR).
*   **Detalle de Factura (Tabla: `compras_items`):**
    *   `id` (UUID - Primary Key).
    *   `factura_id` (UUID - Foreign Key -> `compras_facturas.id`, ON DELETE CASCADE).
    *   `ingrediente_id` (UUID - Foreign Key -> `ingredientes.id`).
    *   `cantidad_comprada` (NUMERIC): En unidad_compra de catálogo.
    *   `precio_compra_ap` (NUMERIC): Precio bruto pagado.
*   **Registro de Merma Operativa (Tabla: `mermas_operativas`):**
    *   `id` (UUID - Primary Key).
    *   `fecha_merma` (TIMESTAMP).
    *   `tipo_origen` (VARCHAR): `ingrediente` o `receta`.
    *   `referencia_id` (UUID): ID de la tabla correspondiente.
    *   `cantidad_perdida` (NUMERIC): Cantidad en la unidad neta.
    *   `motivo` (VARCHAR): `vencido`, `quemado`, `derrame_caida`, `error_preparacion`.
    *   `costo_perdida` (NUMERIC): Calculado automáticamente.
*   **Auditoría de Compras y Recalculación en Cascada:**
    *   **Mesa de control de errores (Auditoría):** Si se corrige una factura en la UI de Auditoría de Mixo, el sistema guarda la corrección en `compras_items`, actualiza el `precio_activo` en `ingredientes` y dispara un Trigger local/función que recalcula en cascada el costo final de todas las recetas asociadas al ingrediente.
*   **Historial de Precios a lo Largo del Tiempo (Tabla: `precios_historicos`):**
    *   Inyección automática al guardar facturas.
    *   `id` (UUID - Primary Key), `timestamp` (TIMESTAMP), `ingrediente_id` (UUID -> `ingredientes.id`), `proveedor_id` (UUID -> `proveedores.id`), `precio_unitario_ap` (NUMERIC), `cantidad` (NUMERIC).

---

### MÓDULO 4: Configuración Financiera y Margen Objetivo
Configuración general de la operación del local, editable en cualquier momento.

*   **Tabla: `configuraciones_local`**
    *   `id` (UUID - Primary Key).
    *   `alquiler` (NUMERIC), `servicios_publicos` (NUMERIC), `nomina_administrativa` (NUMERIC), `otros_gastos` (NUMERIC).
    *   `platos_proyectados_mensuales` (INTEGER).
    *   `factor_condimento_global` (NUMERIC): ej. `2.0` (2% automático).
    *   `margen_alimentos_objetivo` (NUMERIC): ej. `30.0` (Target food cost 30%).
    *   `porcentaje_impuestos` (NUMERIC): ej. `8.0` (IVA/Consumo 8%).
*   **Fórmulas Financieras de Costeo Final:**
    $$\text{Costo MPD con Condimentos} = \text{Costo Materia Prima Directa} \times \left(1 + \frac{\text{factor\_condimento\_global}}{100}\right)$$
    $$\text{Precio Neto Sugerido} = \frac{\text{Costo MPD con Condimentos} + \text{Costo Indirecto}}{\left(\frac{\text{margen\_alimentos\_objetivo}}{100}\right)}$$
    $$\text{Precio al Público Sugerido} = \text{Precio Neto Sugerido} \times \left(1 + \frac{\text{porcentaje\_impuestos}}{100}\right)$$

---

## 3. Modelo de Entidad-Relación Relacional (SQL Schema)

Este script DDL define la estructura de tablas relacionales exacta que implementaremos en Supabase, incluyendo la nueva tabla de categorías:

```sql
-- Habilitar la extensión de UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Tabla de Categorías de Ingredientes
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

-- 1. Catálogo de Ingredientes
CREATE TABLE ingredientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE RESTRICT, -- Vínculo relacional fuerte
    unidad_compra VARCHAR(50) NOT NULL,
    unidad_receta VARCHAR(50) NOT NULL,
    factor_conversion NUMERIC NOT NULL,
    factor_densidad NUMERIC DEFAULT NULL,
    rendimiento_porcentaje NUMERIC NOT NULL CHECK (rendimiento_porcentaje > 0 AND rendimiento_porcentaje <= 100),
    precio_activo NUMERIC NOT NULL DEFAULT 0.0,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Directorio de Proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_comercial VARCHAR(255) NOT NULL,
    nit VARCHAR(50),
    contacto_nombre VARCHAR(255),
    telefono VARCHAR(50),
    correo VARCHAR(255)
);

-- 3. Catálogo de Recetas
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    es_sub_receta BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_integracion_pos VARCHAR(100) DEFAULT NULL,
    unidad_rendimiento VARCHAR(50) NOT NULL,
    cantidad_rendimiento NUMERIC NOT NULL,
    vida_util_horas INTEGER,
    temperatura_almacenado VARCHAR(255),
    alergenos VARCHAR(50)[],
    tiempo_preparacion_total INTEGER DEFAULT 0,
    actualizado_por VARCHAR(100),
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ingredientes en Recetas (Tabla Pivot Relacional)
CREATE TABLE receta_ingredientes (
    receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
    ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
    sub_receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
    cantidad_requerida NUMERIC NOT NULL,
    PRIMARY KEY (receta_id, ingrediente_id),
    CONSTRAINT check_reference CHECK (
        (ingrediente_id IS NOT NULL AND sub_receta_id IS NULL) OR 
        (ingrediente_id IS NULL AND sub_receta_id IS NOT NULL)
    )
);

-- 5. Pasos de Preparación de Recetas
CREATE TABLE receta_pasos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
    numero_paso INTEGER NOT NULL,
    estacion VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    tiempo_minutos INTEGER NOT NULL,
    temperatura_objetivo NUMERIC,
    ingredientes_asociados UUID[]
);

-- 6. Facturas de Compra
CREATE TABLE compras_facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_numero VARCHAR(100) NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    fecha_compra TIMESTAMP WITH TIME ZONE NOT NULL,
    registrado_por VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Items de Facturas de Compra
CREATE TABLE compras_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID REFERENCES compras_facturas(id) ON DELETE CASCADE,
    ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
    cantidad_comprada NUMERIC NOT NULL,
    precio_compra_ap NUMERIC NOT NULL
);

-- 8. Historial de Precios (Time-Series)
CREATE TABLE precios_historicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    precio_unitario_ap NUMERIC NOT NULL,
    cantidad NUMERIC NOT NULL
);

-- 9. Registro de Mermas Operativas
CREATE TABLE mermas_operativas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_merma TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tipo_origen VARCHAR(50) NOT NULL,
    referencia_id UUID NOT NULL,
    cantidad_perdida NUMERIC NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    costo_perdida NUMERIC NOT NULL,
    registrado_por VARCHAR(100)
);

-- 10. Configuración del Local
CREATE TABLE configuraciones_local (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alquiler NUMERIC DEFAULT 0.0,
    servicios_publicos NUMERIC DEFAULT 0.0,
    nomina_administrativa NUMERIC DEFAULT 0.0,
    otros_gastos NUMERIC DEFAULT 0.0,
    platos_proyectados_mensuales INTEGER DEFAULT 1,
    factor_condimento_global NUMERIC DEFAULT 2.0,
    margen_alimentos_objetivo NUMERIC DEFAULT 30.0,
    porcentaje_impuestos NUMERIC DEFAULT 8.0,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Capa de Integración / Endpoints GET Autogenerados por Supabase

Al usar Supabase, **todas las tablas son instantáneamente accesibles como endpoints REST** a través de PostgREST de forma nativa. Unify podrá consumir los datos mediante consultas HTTPS limpias usando la librería nativa de Supabase o curl:

### 1. Historial de Precios para Unify:
`GET https://[project-id].supabase.co/rest/v1/precios_historicos?select=timestamp,precio_unitario_ap,cantidad,ingredientes(nombre),proveedores(nombre_comercial)`

### 2. Costo de Platos y SKU del POS para Unify:
`GET https://[project-id].supabase.co/rest/v1/recetas?select=id,nombre,codigo_integracion_pos,unidad_rendimiento,cantidad_rendimiento`

### 3. Reporte de Mermas Operativas para Unify:
`GET https://[project-id].supabase.co/rest/v1/mermas_operativas?select=fecha_merma,tipo_origen,cantidad_perdida,motivo,costo_perdida`

---

## 5. Alineación Estricta con el Manual de Estilo de Interfaz (UI)

La UI de Mixo React mantendrá las variables de diseño y reglas táctiles de bajo contraste especificadas en las hojas de estilo base.
*   **Bordes:** Todo elemento de interfaz (`div` contenedor, tarjetas de lista, formularios) tendrá un borde perimetral de `1px` sólido (`#444746` en oscuro / `#c4c7c5` en claro).
*   **Esquinas:** `24px` fijos en tarjetas/contenedores; `28px` fijos en botones e inputs (estilo cápsula).
*   **Sombras:** Prohibido el uso de sombras (`box-shadow: none`).
