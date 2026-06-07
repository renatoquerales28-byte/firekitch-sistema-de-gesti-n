IMPORTANT

Para sentar unas bases sólidas y modulares ("Lego"), necesitamos definir algunos aspectos clave. Por favor, responde a las siguientes preguntas:

Usuarios y Dispositivos Principales:  
¿Quiénes serán los usuarios primarios de esta primera fase (calculadora de costos)? (Ej. dueños de restaurantes, chefs en cocina, administradores).

r: dueños de restaurantes, chefs en cocina, administradores

¿En qué dispositivos se usará principalmente? (Ej. teléfonos móviles en la cocina, tablets en barra, o computadoras de escritorio en oficina).

r: primeramente lo diseñaremos para pc de oficina

Estrategia Con/Sin Conexión (Offline-First):  
¿Cómo visualizas la sincronización de datos?

Opción A: Un sistema 100% local en el navegador (PWA con IndexedDB/LocalStorage) que funcione de forma autónoma, con la opción de exportar/importar archivos (JSON/CSV) y que en el futuro se conecte opcionalmente a una base de datos en la nube.

Opción B: Un sistema que sincronice automáticamente con una base de datos en la nube (ej. Firebase o base de datos propia) tan pronto como detecte conexión, manteniendo los datos locales para cuando no haya internet.  
   
r: opcion b

Definición de "Piezas de Lego" (Futuros Módulos):

Además de la Calculadora de Costos (Fase 1\) y el Control de Inventario (Fase 2), ¿qué otras piezas te gustaría integrar en el futuro? (Ej. Gestión de Recetas, Control de Merma/Desperdicios, Gestión de Proveedores, Punto de Venta/POS, Reportes de Rentabilidad).

r: exacto, todo lo que podamos implementar para gestionar un restaurante

Alcance de la Calculadora de Costos (Fase 1):

¿Qué elementos debe contemplar el cálculo del costo de un plato?

Costo de Ingredientes (Materia Prima Directa).

Costos Indirectos de Fabricación (Servicios públicos, gas, mano de obra, empaque, etc.) calculados como un porcentaje fijo o un monto prorrateado.

de ambos, pero no se si se podria hacer por separado, porque creo que del costo de los ingredientes se tiene que encargar el chef y de la parte de los costos indirectos o gastos, se encarga el administrador. en realidad no se muy bien como deberia ser 

¿Deseas que calcule automáticamente el margen de ganancia y sugiera un precio de venta basado en un porcentaje de costo objetivo (ej. costo del 30%)?

quiero que los porcentajes sean editables, la mayoría deberia serlo

Preferencias Visuales y Estética:

Para que la aplicación se sienta premium e interactiva, ¿tienes alguna preferencia de color, estilo o temática? (Ej. modo oscuro elegante, tonos cálidos gastronómicos como terracota/madera/oro, o un diseño súper limpio y minimalista estilo dashboard tecnológico).

**Manual de Estándares de Interfaz de Usuario (UI)**

## **Sistema de Diseño de Bajo Contraste y Alta Legibilidad**

Este documento establece las reglas técnicas inalterables para la construcción de interfaces digitales optimizadas para la reducción de la fatiga visual. Se prohíbe el uso de negro puro (\#000000), blanco puro (\#FFFFFF) como fondo completo, y el uso de sombras proyectadas (box-shadow). La profundidad y la jerarquía se definen estrictamente mediante geometría de bordes y contraste plano de color.

## **1\. Estructura de Superficies y Bloques (Flat Design)**

Para mantener la limpieza visual y eliminar la sobrecarga de elementos tridimensionales, el diseño es 100% plano (flat).

* **Fondo Base de la Aplicación:** Plano, sin gradientes ni texturas.  
* **Contenedores y Tarjetas (div):** Bloques sólidos con color de superficie diferenciado de la base de fondo.  
* **Especificación de Bordes para div:** Todo contenedor o tarjeta debe llevar un borde perimetral obligatorio de 1px sólido. No se permiten bordes punteados, dobles o discontinuos.  
  * *Color del borde en Modo Oscuro:* \#444746 estrictamente.  
  * *Color del borde en Modo Claro:* \#c4c7c5 estrictamente.  
* **Esquinas de Contenedores (border-radius):** Queda estrictamente prohibido el uso de esquinas en ángulo recto (90 grados). Todos los contenedores (div) deben tener un radio de curvatura obligatorio de 24px fijos.

## **2\. Sistema de Rejilla y Distancias (Spacing)**

El flujo y alineación de elementos se rigen por un sistema basado estrictamente en múltiplos de 4px:

* **Separación entre bloques principales (div contenedores):** 24px fijos (margin-bottom: 24px o gap: 24px).  
* **Separación entre elements del mismo grupo (Formularios/Campos):** 16px fijos.  
* **Separación entre etiqueta (label) y su campo (input):** 8px fijos.  
* **Espacio interno obligatorio (Padding) de tarjetas:** 24px uniforme en los cuatro lados.

## **3\. Tipografía y Jerarquía Visual**

Para evitar el efecto "halo" (difuminación lumínica) que se genera en pantallas oscuras con letras excesivamente gruesas, se prohíbe el uso de peso tipográfico bold (700).

* **Fuente Única:** Inter  
* **Títulos Principales (H1):** 32px | Peso 500 (Medium).  
* **Títulos de Sección / Cabecera de Tarjeta (H2):** 20px | Peso 500 (Medium).  
* **Cuerpo de Texto / Datos de Tablas:** 16px | Peso 400 (Regular).  
* **Etiquetas / Micro-copy / Descripciones:** 14px | Peso 500 (Medium).

## **4\. Especificación de Inputs (Campos de Entrada)**

La geometría y comportamiento de todos los campos de ingreso de texto o números es idéntica en toda la aplicación:

* **Altura fija (height):** 44px fijos.  
* **Padding interno:** 16px estrictamente horizontal (izquierda y derecha).  
* **Radio de curvatura (border-radius):** 28px (Estilo cápsula/píldora).  
* **Grosor de línea de borde (Reposo):** 1px sólido.  
* **Grosor de línea de borde (Focus / Selección activa):** 2px sólido.

## **5\. Especificación de Botones**

Todos los botones de acción comparten las mismas dimensiones espaciales, variando únicamente su comportamiento cromático:

* **Altura fija (height):** 40px fijos.  
* **Radio de curvatura (border-radius):** 28px (Estilo cápsula/píldora).  
* **Tamaño de texto interno:** 14px | Peso 500 (Medium).

### **Categorías de Botón:**

1. **Botón Primario (Acciones de Confirmación / Enviar):** Bloque de color sólido de alto contraste con texto oscuro/claro invertido para máxima legibilidad. Sin bordes ni sombras de ningún tipo.  
2. **Botón Secundario (Acciones Alternativas / Añadir):** Fondo sutil o transparente con un borde perimetral obligatorio de 1px sólido.  
3. **Botón de Acción Rápida (Eliminar / Cancelar / Acciones de fila):** Fondo completamente transparente. Cambia de color de texto únicamente al pasar el cursor (hover).

## **6\. Paleta de Colores Absoluta y Unificada**

Las combinaciones cromáticas de bajo contraste garantizan que los ojos del usuario toleren largas sesiones de visualización de pantalla sin irritación ni cansancio.

### **A. Paleta Modo Oscuro (Mate / Descanso Visual)**

* **Fondo de Pantalla Principal:** \#131314 (Gris carbón profundo).  
* **Superficie de Tarjetas (div):** \#1e1e1e (Soft Black).  
* **Líneas de Borde / Divisores / HR:** \#444746 (Gris oscuro).  
* **Texto Principal (Títulos y Lectura):** \#e3e3e3 (Blanco hueso mate).  
* **Texto Secundario (Descripciones/Placeholders):** \#949b96 (Gris medio relajado).  
* **Color de Acento (Botón Primario / Focus):** \#a8c7fa (Azul pastel desaturado).  
  * *Nota:* El texto dentro del Botón Primario en Modo Oscuro es estrictamente \#062e6f.

### **B. Paleta Modo Claro (Limpio / Sin Brillo Agresivo)**

* **Fondo de Pantalla Principal:** \#f0f4f9 (Gris azulado muy suave).  
* **Superficie de Tarjetas (div):** \#ffffff (Blanco puro, usado solo para recortar elementos sobre el fondo).  
* **Líneas de Borde / Divisores / HR:** \#c4c7c5 (Gris claro neutro).  
* **Texto Principal (Títulos y Lectura):** \#1f1f1f (Gris carbón oscuro).  
* **Texto Secundario (Descripciones/Placeholders):** \#444746 (Gris neutro).  
* **Color de Acento (Botón Primario / Focus):** \#0b57d0 (Azul plano corporativo).  
  * *Nota:* El texto dentro del Botón Primario en Modo Claro es estrictamente \#ffffff.

## **7\. Líneas y Divisores Visuales**

* **Grosor de Líneas divisorias (HR, Bordes de tablas, Separadores):** 1px sólido.  
* **Color de divisor en Modo Oscuro:** \#444746.  
* **Color de divisor en Modo Claro:** \#c4c7c5.  
* **Filas en Tablas de datos:** Altura mínima de 48px con alineación vertical estrictamente centrada.