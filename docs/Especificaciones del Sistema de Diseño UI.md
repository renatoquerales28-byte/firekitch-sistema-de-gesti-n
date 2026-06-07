# **Manual de Estándares de Interfaz de Usuario (UI)**

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

Todos los botones de acción comparten las mismas dimensiones espaciales y de comportamiento de texto para garantizar consistencia y adaptabilidad (responsividad):

* **Altura fija (height):** 40px fijos.  
* **Radio de curvatura (border-radius):** 28px (Estilo cápsula/píldora).  
* **Tamaño de texto interno:** 14px | Peso 500 (Medium).  
* **Comportamiento del Texto y Responsividad:**  
  * **Prohibición de Multi-línea:** El texto dentro de cualquier botón debe permanecer estrictamente en una sola línea. Queda prohibido el salto de línea automático (white-space: nowrap). El texto jamás debe dividirse en dos líneas.  
  * **Ancho Adaptable:** Los botones no deben tener un ancho de píxel fijo que limite el contenido. Deben definir su ancho de forma dinámica basada en su contenido (width: fit-content) para evitar desbordamientos visuales.  
  * **Ancho Mínimo y Relleno (Padding):** Para mantener la consistencia estética cuando el texto es corto, se establece un ancho mínimo de 120px. El espaciado interno horizontal (padding izquierdo y derecho) debe ser estrictamente de 24px a cada lado para asegurar un margen visual cómodo y elegante alrededor del texto.  
  * **Control de Desbordamiento Extremo:** En resoluciones de pantalla extremadamente críticas donde el ancho del botón supere el contenedor padre, se aplicará truncamiento con puntos suspensivos (text-overflow: ellipsis; overflow: hidden;) para salvaguardar la integridad de la maquetación.

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

## **8\. Restricciones Absolutas de Elementos Gráficos (Iconos y Emojis)**

Para mantener la máxima sobriedad, la limpieza técnica y evitar interpretaciones ambiguas en la interfaz de usuario:

* **Prohibición de Emojis:** Queda estrictamente prohibido el uso de emojis o caracteres pictográficos Unicode en cualquier elemento de la interfaz (botones, cabeceras, títulos, tablas, inputs o bloques de texto de párrafo).  
* **Prohibición de Iconos:** Queda estrictamente prohibido el uso de bibliotecas externas de fuentes de iconos (tales como Material Icons, FontAwesome, Lucide o similares) e iconos integrados mediante vectores (SVG) independientes.  
* **Resolución por Texto:** Toda indicación de estado, categoría, botón de acción, dirección de navegación o elemento interactivo debe describirse exclusivamente con texto en idioma natural, respetando las variables de jerarquía tipográfica especificadas en la Sección 3\.