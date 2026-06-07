# **Guía Paso a Paso: Cálculo y Control de Costos en Mixo**

Esta guía describe detalladamente el flujo operativo y matemático dentro de **Mixo** para estructurar, costear y estandarizar tus platillos e ingredientes. Mixo opera bajo un enfoque **modular, offline-first** y está diseñado para alimentar de forma directa a **Unify**, tu plataforma central de analítica de desviaciones financieras.

---

## **Paso 1: Configurar las Reglas Financieras del Negocio (CIF y Márgenes)**

Antes de costear el primer gramo de comida, el Administrador debe establecer el marco financiero del restaurante en la **Consola de Administración > Configuración Global**. Estos valores amortizarán la operación real y guiarán las sugerencias de precios.

1. **Registrar los Costos Fijos Mensuales (CIF - Costos Indirectos de Fabricación):**
   * **Alquiler / Arrendamiento:** Costo del local físico.
   * **Servicios Públicos:** Luz, agua, gas (crítico en cocina) e internet.
   * **Nómina Administrativa:** Sueldos fijos no operativos directos de cocina.
   * **Otros Gastos:** Seguros, mantenimiento o imprevistos mensuales.
2. **Definir el Volumen Mensual Proyectado (Transacciones):**
   * Ingresa la cantidad estimada de platos/porciones que vende tu local al mes (ej. 3,000 platos).
   * **Matemática del Prorrateo:** Mixo sumará todos tus costos fijos y los dividirá entre este volumen para obtener el **CIF prorrateado por plato**:
     $$\text{CIF por Porción} = \frac{\text{Alquiler} + \text{Servicios} + \text{Nómina} + \text{Otros Gastos}}{\text{Volumen de Platos Proyectados}}$$
     *Ejemplo: Con \$6,000 USD de gastos fijos y 3,000 platos proyectados, cada plato carga automáticamente con **+\$2.00 USD** de costos indirectos.*
3. **Establecer el Margen de Alimentos Objetivo (Target Food Cost %):**
   * Configura el porcentaje que debe representar el costo del ingrediente respecto al precio de venta neto (típicamente entre 28% y 35%). 
   * *El 65%-72% restante se usará para amortizar el CIF y generar utilidad de bolsillo.*
4. **Fijar el Factor de Condimento Global (1% a 3%):**
   * Un porcentaje plano que Mixo sumará de manera automática a la materia prima de todas tus recetas. Esto cubre aceites base, sal, pimienta y condimentos menores sin obligar al chef a pesarlos de forma impráctica en la cocina.
5. **Configurar el Impuesto de Ventas (IVA / Impuesto al Consumo %):**
   * Se aplica de forma aditiva sobre el precio de venta sugerido neto para salvaguardar tu margen de ganancia real frente a recaudaciones fiscales.

---

## **Paso 2: Construir el Catálogo de Insumos Base (Chef)**

En la **Consola de Cocina > Catálogo de Insumos**, el Chef registra las materias primas en bruto exactamente como se adquieren con el proveedor.

1. **Ingresar Nombre y Categoría:** Para ordenamiento en inventario (ej. "Queso Mozzarella", Categoría: "Lácteos").
2. **Definir la Unidad de Compra (AP - As Purchased):** Cómo se compra al proveedor (kg, litro, unidad, bulto).
3. **Configurar el Factor de Conversión a Receta:**
   * Establece cuántas unidades de uso en receta caben en la unidad de compra.
   * *Ejemplo: Si compras por Kilogramo (kg) y usas en Gramos (g), el factor es `1000`. Si compras por Litro y usas en Mililitros, es `1000`.*
4. **Ingresar el Rendimiento / Yield % (Porcentaje de Aprovechamiento):**
   * No todo lo que se compra llega al plato. Debes restar la merma de limpieza (cáscaras, huesos, recortes, exceso de grasa).
   * Si de 1 kg de papas peladas obtienes 800 g de papa limpia, el rendimiento es del **80%**.
   * **Matemática del Costo Neto (EP - Edible Portion):** Mixo calcula el costo real por gramo o unidad limpia aplicando la fórmula:
     $$\text{Costo EP por Unidad de Uso} = \frac{\text{Precio de Compra Bruto}}{\text{Factor de Conversión} \times (\text{Rendimiento \%} / 100)}$$
     *Ejemplo: Carne comprada a \$10 USD/kg con rendimiento del 80% cuesta en bruto \$0.01 USD/gramo (AP), pero su costo limpio real en plato es de **\$0.0125 USD/gramo (EP)**.*
5. **Especificar el Factor de Densidad (g/ml - Opcional):**
   * Si compras un ingrediente líquido por peso (kg) pero tus recetas lo requieren por volumen (ml) (ej. aceite, miel, salsas densas), ingresa su gravedad específica para que el motor convierta el volumen a masa antes de calcular el costo.

---

## **Paso 3: Crear Sub-recetas de Lote (Anidamiento Opcional)**

Muchos platos a la carta utilizan preparaciones previas preparadas en masa (salsas base, adobos, masas de pizza, caldos). En Mixo, puedes estructurar estas como **Sub-recetas**.

1. Crea una receta y marca la opción **"Sí, es una Sub-receta de Lote"** en sus especificaciones.
2. Define la **Unidad de Lote** (kg, litro o porciones) y la **Cantidad de Rendimiento de Lote** (ej. Rinde `5` litros de salsa).
3. Agrega las materias primas del Catálogo de Insumos y sus gramos/ml de uso.
4. **Matemática de Anidación:** Mixo calculará el costo total del lote y guardará el **costo por unidad de lote** (ej. costo por ml). Esta sub-receta ahora aparecerá disponible como un "insumo" más al momento de costear platos finales.

---

## **Paso 4: Escribir la Fórmula del Plato de Menú Final**

En la **Consola de Cocina > Recetarios y Fichas**, haz clic en **"Crear Nueva Receta"** y completa el perfil técnico del plato.

1. **Identificadores Básicos:** Ingresa el nombre del plato y su **SKU / Código de Integración POS** (ej. `PLT-LAS-01`). *Este código es la clave de sincronización con Unify para conciliar ventas reales.*
2. **Definir el Rendimiento:** Selecciona la unidad "Porciones" e indica cuántos platos individuales produce este lote de preparación (típicamente `1` para platos directos a la carta).
3. **Ingresar la Fórmulación Base:**
   * Selecciona los insumos culinarios y sub-recetas de la lista desplegable.
   * Escribe la cantidad neta requerida de uso en receta (ej. 150 gramos de Queso Mozzarella).
4. **Establecer Ficha Operativa y Alérgenos:**
   * Indica las horas estimadas de vida útil recomendada en almacén y la temperatura de conservación.
   * Selecciona los alérgenos presentes para la inocuidad alimentaria del cliente.

---

## **Paso 5: El Motor Financiero de Costeo de Mixo (Cálculo del Precio de Venta)**

A medida que el Chef introduce las cantidades de los insumos, el motor asíncrono de Mixo procesa el flujo matemático en cascada y en tiempo real en la **"Matemáticas del Plato en Tiempo Real"**:

```
[Insumos Netos (Costo EP)] + [Sub-recetas Anidadas]
                     │
                     ▼
       (1) Costo Materia Prima Lote
                     │
                     ▼   (+ % Condimento Global)
       (2) Costo Ajustado con Condimentos
                     │
                     ▼   (/ Cantidad de Rendimiento)
     (3) Costo Materia Prima por Porción
                     │
                     ▼   (+ CIF Prorrateado por Porción)
         (4) Costo Real por Porción
                     │
                     ▼   (/ Margen Food Cost Objetivo %)
          (5) Precio Neto Sugerido
                     │
                     ▼   (+ % IVA / Impuesto al Consumo)
       (6) PRECIO SUGERIDO AL PÚBLICO
```

### **Fórmulas de Costeo Detalladas:**

1. **Costo de Materia Prima Lote:**
   $$\text{Costo MP Lote} = \sum \left( \text{Cantidad de Uso} \times \text{Costo EP} \right)$$
2. **Costo Ajustado con Condimento Global:**
   $$\text{Costo Ajustado} = \text{Costo MP Lote} \times \left(1 + \frac{\text{Factor Condimento \%}}{100}\right)$$
3. **Costo de Materia Prima por Porción:**
   $$\text{Costo MP por Porción} = \frac{\text{Costo Ajustado}}{\text{Cantidad de Rendimiento de Lote}}$$
4. **Costo Real Total por Porción:**
   $$\text{Costo Real por Porción} = \text{Costo MP por Porción} + \text{CIF por Porción}$$
5. **Precio Neto Sugerido (Amortizando operación y utilidad):**
   $$\text{Precio Neto Sugerido} = \frac{\text{Costo Real por Porción}}{\text{Margen Alimentos Objetivo \%} / 100}$$
6. **Precio Sugerido al Público (Con Impuestos):**
   $$\text{Precio Público} = \text{Precio Neto Sugerido} \times \left(1 + \frac{\text{Impuesto Ventas \%}}{100}\right)$$

---

## **Paso 6: Estandarización y Ficha Técnica Imprimible**

Para asegurar que cada plato se prepare exactamente igual y mantener los costos proyectados estables:

1. **Documentar la Guía de Preparación:**
   * Añade los pasos operativos numerados detallando las instrucciones exactas del cocinero.
   * Asigna cada paso a una **Estación de Cocina** (Preparación Fría, Estufa, Parrilla, Horno, Emplatado).
   * Registra el **Tiempo de Ejecución** (minutos) y la **Temperatura de Control** requerida (ej. 74ºC para asegurar eliminación de patógenos).
   * Vincula qué insumos del lote se incorporan físicamente en cada paso.
2. **Generar Ficha Técnica:**
   * Guarda la receta y haz clic en **"Ficha Técnica"**.
   * Mixo creará una ficha culinaria premium limpia y profesional que consolida el lote, la conservación, los alérgenos de seguridad, los ingredientes y la guía operativa paso a paso.
   * Puedes imprimir la ficha para colocarla físicamente en las estaciones de tu cocina.

---

## **Paso 7: Auditoría de Facturas y Actualización en Cascada**

Los precios de los insumos fluctúan constantemente debido a la inflación o cambios de proveedor. Para mantener tus costos actualizados sin re-digitar recetas:

1. El Administrador registra las facturas del día en **Consola de Administración > Captura de Facturas**.
2. Si detectas un error de digitación posterior (ej. ingresaste un precio de carne excedido), ingresa a la subpestaña **"Auditoría de Facturas"**.
3. Haz clic en **"Corregir Factura"** sobre la compra errónea, modifica los valores brutos o cantidades de compra, y haz clic en **"Aplicar Cambios en Cascada"**.
4. **Propagación en Cascada:**
   * Mixo recalculará inmediatamente el Costo Promedio Ponderado del ingrediente en el catálogo base.
   * **Todas las recetas y sub-recetas activas que contengan dicho ingrediente se re-calcularán en segundo plano automáticamente**, actualizando instantáneamente tus costos por porción y precios sugeridos al público en tiempo real.

---

## **Paso 8: Sincronización Estratégica con Unify**

Como Mixo es modular y offline-first, todos tus registros (ingredientes, recetas elaboradas, costos exactos calculados, historial de facturas de compra y bitácora de mermas operativas) se guardan localmente para evitar pérdidas de conexión en cocina.

Mixo expone esta estructura de datos en Supabase y de manera local mediante endpoints GET seguros. **Unify** consume periódicamente estos datos y los cruza con las ventas de tu POS para emitir reportes de desvíos financieros (ej. *"Se facturaron 100 lasañas pero las compras y mermas registradas en Mixo indican que debiste usar 5 kg más de carne; detectado posible desvío por exceso de porcionamiento"*).
