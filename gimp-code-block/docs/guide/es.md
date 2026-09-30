# Guía de uso — GIMP Code Block

## 🗺️ La pantalla del taller

- A la **izquierda**, las categorías de bloques. Haz clic en una categoría para ver sus bloques y luego arrastra un bloque a la zona de construcción.
- En el **centro**, la zona de construcción. Rueda: desplazarse; Ctrl + rueda: zoom; arrastrar en el vacío: moverse.
- A la **derecha**, el panel: 💡 Ayuda (sobre el bloque seleccionado), 🐍 Código (el Python producido), ✅ Revisión, 🤖 IA y 🎓 Curso.
- **Arriba**, los menús, la búsqueda de bloques (tecla /) y el botón ⬇ Descargar.

## 🧩 Las formas de los bloques

- **Bloque con muesca**: una acción. Se apila bajo otro.
- **Bloque redondeado**: un valor (número, texto, capa, variable). Se encaja en un hueco.
- **Bloque puntiagudo (hexagonal)**: una condición verdadero/falso, para «si» y «mientras».
- **Bloque en C**: contiene otros bloques (bucles, condiciones, atajos).

Un bloque en gris está desactivado: no está en el código. Clic derecho en un bloque: duplicar, comentar, desactivar, plegar, ayuda.

## ▶ El bloque de inicio

El bloque amarillo **▶ Cuando lanzo** describe tu plug-in: su nombre en el menú, el menú donde aparece, si necesita una imagen abierta y sus ajustes («primero, preguntar»).

Los ajustes se convierten en la ventana que GIMP muestra antes de lanzar el plug-in. Usa su valor con los bloques 🎛️ de la categoría ▶ Inicio.

**Ajustes ▸ Mi plug-in** configura el resto: autor, deshacer agrupado, gestión de errores, módulos importados.

## ⬇ Descargar e instalar

Haz clic en **⬇ Descargar**: obtienes un archivo `.py`. Ponlo en la carpeta de plug-ins de GIMP y reinicia GIMP.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins`, y luego `chmod +x file.py`
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

La carpeta exacta está en **Editar ▸ Preferencias ▸ Carpetas ▸ Complementos**. Los plug-ins hechos aquí funcionan en **GIMP 2.10** (no en GIMP 3, que tiene otra API).

## 🐍 Importar un script de Python

**Archivo ▸ Importar un script de Python**, o suelta el archivo `.py` en la página. Cada línea se convierte en un bloque Python.

Garantía: mientras no cambies nada, la descarga devuelve **el mismo archivo, byte a byte** (comentarios, espacios y tabulaciones incluidos). Si cambias un bloque, solo se reescriben sus líneas.

Un script con un error de sintaxis se importa igualmente: la parte con fallos se convierte en un bloque 🧱 «código en bruto» que hay que corregir.

## 🟠 Los bloques Python y sus pastillas

- **naranja**: variable; **violeta**: constante de GIMP; **amarillo**: función de GIMP; **verde oscuro**: otra función; bloques verdes: cálculos y comparaciones; huecos blancos: valores escritos tal cual.

Haz clic en una pastilla y escribe: se abre una lista de sugerencias (flechas ↑↓ y luego Intro, o clic). Para una función de GIMP, los huecos que faltan se rellenan solos.

Clic derecho en una llamada a función: añadir o quitar un argumento. Clic derecho en «si»: añadir «si no, si» o «si no».

La categoría 🐍 Python muestra las variables de tu script y **atajos GIMP** listos para usar (deshacer agrupado, bucle sobre las imágenes, sobre las capas…).

## ⚙️ Las 857 funciones de GIMP (PDB)

Dos formas de usarlas: el bloque «⚙️ función de GIMP» (🧰 Avanzado) en un plug-in de bloques sencillos, o el bloque «llamar …» en los bloques Python.

Búsqueda: escribe una palabra en inglés o francés (blur, layer, selection, text…). Las funciones más usadas salen primero; «antigua» marca una función obsoleta que tiene sustituta.

El `run_mode` nunca hay que darlo: pygimp lo añade. Las listas suelen tener un contador justo antes (p. ej. `num_points` y luego `points`).

## ⚡ Atajos GIMP

Bloques que sustituyen lo que todo script escribe a mano:
- «en un solo paso de deshacer»: todo cuenta como un único Ctrl+Z, aunque haya un error;
- «devolviendo luego…» los colores y herramientas, la selección o la capa activa;
- «para cada imagen abierta», «para cada capa de todas las imágenes», «para cada archivo de la carpeta»;
- «nueva capa del tamaño de la imagen», «copiar la capa en otra imagen».

## ✅ Revisión y errores

La pestaña **✅ Revisión** vuelve a leer tu plug-in tras cada cambio: 🛑 error (no funcionaría), ⚠️ conviene mirarlo, ℹ️ información. Haz clic en una línea para ir al bloque.

En GIMP: **Ventanas ▸ Diálogos empotrables ▸ Consola de errores** muestra los errores de Python. Los plug-ins hechos aquí también muestran el error completo en un mensaje.

**Filtros ▸ Python-Fu ▸ Consola**: para probar una línea de Python directamente en GIMP.

## 🤖 El asistente IA

**IA ▸ Elegir la IA**: cualquier servicio compatible (OpenAI, Anthropic, Gemini, Mistral…), una IA local (Ollama, LM Studio) o el modo copiar y pegar, sin conexión.

Pide una función, un plug-in entero, una corrección o una explicación. La respuesta se revisa y se repara automáticamente antes de convertirse en bloques.

## 💾 Guardar tu trabajo

El taller guarda tu trabajo automáticamente en este navegador.

Para guardarlo en otro sitio o compartirlo: **Archivo ▸ Guardar el proyecto** (archivo `.json`). El `.py` descargado también contiene la huella de los bloques: al reimportarlo, recuperas tus bloques exactamente.

## ❓ Problemas frecuentes

- **El plug-in no aparece**: carpeta equivocada, GIMP sin reiniciar, archivo no ejecutable (Linux) o falta Python-Fu (Linux: paquete `gimp-python`).
- **El menú está en gris**: el plug-in necesita una imagen abierta (casilla del bloque ▶).
- **«argument count» / «wrong type»**: mira la pestaña ✅ Revisión, indica el número de argumentos esperado.
- **Acentos raros**: usa los bloques de texto del taller, ellos se encargan del UTF-8 por ti.

---

# Curso: de principiante total a profesional

Cada lección explica una idea y luego te da una misión. El taller comprueba solo cuándo lo has logrado.

## 🌱 Nivel 1 — Primeros pasos

*¿Nunca has programado? Perfecto, empezamos aquí.*

### 1. Tu primer plug-in

🎯 **Hacer que GIMP diga «Hola».**

Un **plug-in** es un pequeño programa que añade un comando a los menús de GIMP. Aquí lo construyes encajando bloques, como un rompecabezas: el taller escribe el verdadero código Python por ti.

Todo plug-in empieza con el bloque amarillo **▶ Cuando lanzo**. Los bloques colocados bajo «luego hacer» se ejecutan **de arriba abajo**, uno tras otro.

**Tu misión**

1. Haz clic en el bloque de abajo para añadirlo: se engancha solo bajo «luego hacer».
2. Haz clic en el hueco blanco del mensaje y escribe tu texto.
3. Mira la pestaña 🐍 Código: ha aparecido la línea `pdb.gimp_message(...)`.

### 2. Instala tu plug-in en GIMP

🎯 **Ver tu plug-in en los menús de GIMP y lanzarlo.**

GIMP carga los plug-ins al arrancar, desde una carpeta especial llamada **plug-ins**.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins` (y luego haz el archivo ejecutable: `chmod +x file.py`)
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

La ruta exacta aparece en GIMP: **Editar ▸ Preferencias ▸ Carpetas ▸ Complementos**.

**Tu misión**

1. En el bloque ▶, ponle un nombre a tu plug-in y elige su menú.
2. Haz clic en **⬇ Descargar** arriba a la derecha.
3. Pon el archivo `.py` en la carpeta de plug-ins y **reinicia GIMP**.
4. Abre una imagen y busca tu plug-in en el menú que elegiste. Haz clic: ¡aparece tu mensaje!
5. Cuando funcione, haz clic en «Lo logré».

> 💡 ¿El plug-in no aparece? Comprueba que el archivo está de verdad en la carpeta de plug-ins (no en una subcarpeta de más), que termina en .py y que reiniciaste GIMP. En Linux también necesitas el paquete gimp-python.

### 3. Actuar sobre la imagen: una capa nueva

🎯 **Crear una capa rellena de blanco en la imagen.**

Una **capa** es una hoja transparente colocada sobre la imagen. Los bloques morados (📑 Capas) las crean y las modifican.

El bloque «nueva capa» de la categoría ⚡ Atajos hace de una vez lo que los programadores escriben en 3 líneas: crear la capa, añadirla a la imagen y rellenarla.

Fíjate en los óvalos azules «🖼️ imagen actual»: son **valores**. Representan la imagen sobre la que lanzaste el plug-in.

**Tu misión**

1. Añade el bloque de abajo.
2. Cambia su nombre («Mi capa») y elige «blanco» en la lista.
3. Descarga, reemplaza el archivo antiguo en GIMP, reinicia y prueba.

### 4. Hacerle una pregunta al usuario

🎯 **Pedir un número al lanzar y usarlo.**

Cuando un plug-in tiene **ajustes**, GIMP abre una pequeña ventana antes de lanzarlo: el usuario elige un número, un texto, un color…

Los ajustes van en la parte «primero, preguntar» del bloque ▶. Después, el bloque «🎛️ valor del ajuste» (categoría ▶ Inicio) da lo que eligió el usuario.

**Tu misión**

1. Abre la categoría **▶ Inicio y ajustes** y arrastra un ajuste «🔢 número entero» a «primero, preguntar». Ponle un nombre, por ejemplo `opacity`.
2. Añade el bloque «opacidad de …» de abajo.
3. En su hueco del porcentaje, suelta el bloque 🎛️ del ajuste (aparece en la categoría ▶ Inicio cuando el ajuste existe).

## 🌿 Nivel 2 — Bases de la programación

*Variables, bucles, condiciones: las 3 ideas que hay detrás de todo programa.*

### 5. Variables: cajas que recuerdan

🎯 **Guardar un valor en una variable y volver a usarlo.**

Una **variable** es una caja con nombre. Guardas en ella un valor (un número, un texto, una capa…) para usarlo más tarde.

«fijar `x` a 5» mete 5 en la caja `x`. Después, cada bloque `x` vale 5. Si metes otra cosa en `x`, el valor anterior se reemplaza.

Los bloques que crean algo (capa, texto, imagen) suelen tener una flecha **→ en**: el resultado se guarda en una variable, para que puedas cambiarlo después.

**Tu misión**

1. Abre **📦 Variables y listas** y haz clic en «➕ Crear una variable». Llámala `name`.
2. Añade «fijar … a …» y pon un texto, por ejemplo «Hola».
3. Añade «💬 mostrar el mensaje» y suelta dentro el bloque de tu variable.

### 6. Repetir: los bucles

🎯 **Crear 5 capas de una vez.**

Un ordenador nunca se cansa: un **bucle** ejecuta los mismos bloques tantas veces como quieras.

«repetir 10 veces» es el más sencillo. «contar con `i` de 1 a 10» hace lo mismo, pero la variable `i` vale 1, luego 2, luego 3…: útil para numerar.

Los bloques en forma de **C** contienen otros bloques: todo lo de dentro se repite.

**Tu misión**

1. Añade el bloque «contar con …» de abajo y pon 5 como final.
2. Arrastra un bloque «nueva capa» **dentro** de la C.
3. Extra: en el nombre de la capa, usa «unir … y …» (🧮 Cálculos y texto) para escribir «Capa» + `i`.

### 7. Elegir: las condiciones

🎯 **Hacer algo solo si la imagen es más ancha que alta.**

«**si** … **entonces** …» solo ejecuta los bloques de dentro si la condición es verdadera.

Una condición es un bloque **hexagonal** (puntiagudo por los dos lados): una comparación como «… > …», «… contiene …», «… y …».

Con «si … entonces … si no …», eliges entre dos caminos.

**Tu misión**

1. Añade «si … entonces».
2. En su hueco puntiagudo, suelta una comparación «… > …».
3. A la izquierda pon «ancho de imagen actual»; a la derecha, «alto de imagen actual».
4. Dentro de la C, pon un mensaje «¡Imagen apaisada!».

### 8. Recorrer todas las capas

🎯 **Hacer lo mismo con cada capa de la imagen.**

«para cada capa `layer` de imagen actual» es un bucle especial: en cada vuelta, la variable `layer` contiene **una** capa de la imagen, luego la siguiente…

Así se renombran, ocultan o cambian 200 capas con un clic. Con la casilla «buscar también en los grupos», también se visitan las capas guardadas en carpetas.

**Tu misión**

1. Añade «para cada capa».
2. Dentro, pon «opacidad de …» y suelta la variable `layer` en su primer hueco.
3. Elige 50 %: todas tus capas quedan medio transparentes.

## 🌳 Nivel 3 — GIMP de verdad

*Selecciones, texto, varias imágenes, carpetas enteras.*

### 9. Seleccionar y pintar

🎯 **Rellenar un rectángulo de color.**

La **selección** (las líneas discontinuas) limita las acciones a una zona. En GIMP, casi todos los filtros y rellenos solo afectan a la selección.

Las posiciones se cuentan en píxeles desde la **esquina superior izquierda**: x hacia la derecha, y hacia abajo.

Acuérdate de no seleccionar nada al final, para devolver el control limpio al usuario.

**Tu misión**

1. Añade «color de primer plano» y elige un color.
2. Añade «seleccionar un rectángulo» (x 0, y 0, 200 × 100).
3. Añade «rellenar la selección de … con color de primer plano».
4. Termina con «no seleccionar nada».

### 10. Escribir texto

🎯 **Añadir una capa de texto a la imagen.**

El bloque «escribir …» crea una **capa de texto**: la fuente, el tamaño, el color y la posición se ajustan en el bloque.

La capa de texto se guarda en una variable (→ en `text`): después puedes moverla, cambiar su opacidad, etc.

**Tu misión**

1. Añade el bloque «escribir».
2. Pon tu texto, un tamaño de 60 px y un color.
3. Extra: usa un ajuste «texto corto» para que el usuario elija el texto.

### 11. Trabajar con todas las imágenes abiertas

🎯 **Aplicar una acción a cada imagen abierta, con un deshacer limpio.**

Un plug-in no está obligado a trabajar solo con la imagen actual. «para cada imagen abierta» recorre **todas** las imágenes abiertas en GIMP.

Normalmente, cada acción cuenta como un paso de deshacer. El atajo ⚡ agrupa todo lo que el plug-in hace en una imagen en **un solo Ctrl+Z**.

Dentro del bucle, usa la variable `img` en lugar de «imagen actual».

**Tu misión**

1. Añade «para cada imagen abierta (un deshacer por imagen)».
2. Dentro, pon «aplanar …» y suelta `img` en su hueco.
3. Abre 3 imágenes en GIMP y lanza tu plug-in.

### 12. Procesar una carpeta entera (por lotes)

🎯 **Abrir cada imagen de una carpeta, cambiarla y exportarla en PNG.**

El **procesamiento por lotes** es el verdadero superpoder de los scripts: 500 archivos procesados mientras te tomas un café.

El atajo «para cada archivo de imagen de la carpeta» abre cada archivo sin ventana, ejecuta tus bloques y luego libera la memoria.

Consejo: añade un ajuste «📁 carpeta a elegir» para que el usuario elija la carpeta en GIMP.

**Tu misión**

1. Añade el bloque de lote de abajo, con la extensión `.jpg`.
2. Dentro, pon «exportar … en PNG a …» con `img`.
3. Para la ruta, une el nombre del archivo y «.png» (🧮 Cálculos y texto).

## 🚀 Nivel 4 — Hacia el código (pro)

*Leer y escribir Python, usar las 857 funciones de GIMP, depurar.*

### 13. Leer el Python que has construido

🎯 **Entender la relación entre un bloque y sus líneas de código.**

Cada bloque corresponde a una o varias líneas de **Python 2.7**, el lenguaje de los plug-ins de GIMP 2.10.

En la pestaña 🐍 Código, **haz clic en un bloque**: sus líneas se iluminan. **Haz clic en una línea**: se selecciona su bloque. Es la mejor forma de aprender a leer código.

Recuerda: en Python, lo que está **desplazado a la derecha** (la sangría) está «dentro», exactamente como los bloques dentro de una C.
- `pdb.gimp_...(...)`: una llamada a una función de GIMP
- `x = ...`: se guarda un valor en la variable `x`
- `for ... in ...:`: un bucle; `if ...:`: una condición

**Tu misión**

1. Abre la pestaña 🐍 Código.
2. Haz clic en tres bloques distintos y mira las líneas que se iluminan.

### 14. Pasar a los bloques Python

🎯 **Convertir tu plug-in en bloques Python, una línea = un bloque.**

Los bloques sencillos son cómodos, pero los bloques **Python** te muestran todo el código, línea a línea, y te dejan cambiarlo todo.

En los bloques Python, los colores te ayudan:
- pastilla **naranja**: una variable (`image`, `layer`, `x`)
- pastilla **violeta**: una constante de GIMP (`FILL_WHITE`, `NORMAL_MODE`)
- pastilla **amarilla**: una función de GIMP (`pdb.…`)
- bloques verdes: cálculos y comparaciones (`+`, `==`, `and`…)

Haz clic en una pastilla y escribe unas letras: se abre una lista de sugerencias.

**Tu misión**

1. Haz clic en el botón de abajo (o Archivo ▸ Ver este plug-in como bloques Python).
2. Explora: haz clic en una pastilla naranja y mira las variables que se proponen.

### 15. Las 857 funciones de GIMP

🎯 **Llamar a una función de la PDB con los argumentos correctos.**

La **PDB** (Procedure DataBase) es la lista de todo lo que GIMP sabe hacer: 857 funciones. Todo lo que haces con el ratón en GIMP tiene su función.

En un bloque «llamar …», haz clic en el nombre de la función y escribe una palabra, en inglés o francés: **blur**, **layer**, **text**… La lista muestra cada función con sus argumentos y una explicación. Elige una: los huecos se rellenan solos.

La 🔍 del bloque abre la lista completa, ordenada por grupos.

Regla de oro: el `run_mode` **nunca** se pasa — pygimp lo añade él solo.

**Tu misión**

1. Añade un bloque «llamar …» (categoría 🐍 Python).
2. Haz clic en su nombre, escribe «blur» y elige `plug_in_gauss`.
3. Cambia los 0.0 por 5.0 para un desenfoque de 5 píxeles.

### 16. Depurar como un profesional

🎯 **Encontrar y entender un error.**

Todo el mundo se equivoca, incluso los profesionales. La diferencia: saben **dónde mirar**.
- La pestaña **✅ Revisión** encuentra muchos errores **antes** que GIMP: hueco vacío, número de argumentos incorrecto, función desconocida… Haz clic en un problema para ver el bloque.
- En GIMP, los errores aparecen en **Ventanas ▸ Diálogos empotrables ▸ Consola de errores**.
- Para ver qué vale una variable mientras se ejecuta el plug-in, muéstrala: `pdb.gimp_message(str(x))`.
- **Filtros ▸ Python-Fu ▸ Consola** te permite probar una línea de Python directamente en GIMP.

Lee los errores **de abajo arriba**: la última línea dice qué va mal, la de encima dice dónde.

**Tu misión**

1. Abre la pestaña ✅ Revisión.
2. Añade un «llamar …» a `pdb.gimp_message` y pon dentro una variable, por ejemplo `str(image.width)`.

### 17. Escribe tus propias funciones

🎯 **Guardar un trozo de código en una función y llamarla.**

Cuando repites las mismas líneas en varios sitios, guárdalas en una **función**: «definir `my_function(layer)`». Después, un solo bloque «llamar `my_function(...)`» lo hace todo.

Los **parámetros** (entre paréntesis) son variables que se rellenan en el momento de la llamada. «devolver …» devuelve un resultado.

Un buen nombre de función dice lo que hace: `make_grey`, `number_layers`… Tus funciones también aparecen en las sugerencias.

**Tu misión**

1. Añade «definir …» con el nombre `griser` y el parámetro `calque`.
2. Dentro, llama a `pdb.gimp_drawable_desaturate(calque, DESATURATE_LUMINANCE)`.
3. En otro sitio, llama a `griser(drawable)`.

### 18. Importar, cambiar, compartir

🎯 **Abrir un script real existente y cambiarlo sin romperlo.**

¿Encontraste un plug-in en Internet? **Archivo ▸ Importar un script de Python**: cada línea se convierte en un bloque, y la descarga devuelve **exactamente el mismo archivo** mientras no cambies nada. Si cambias un bloque, solo cambian sus líneas.

El **asistente IA** (pestaña 🤖) puede escribir una función, explicar un script o corregir un error. Sus respuestas se revisan (Python 2.7, funciones reales de GIMP, número correcto de argumentos) antes de convertirse en bloques.

Ya sabes leer, escribir y corregir plug-ins de GIMP. Lo siguiente: abre scripts de otras personas, léelos bloque a bloque y construye los tuyos. **¡Enhorabuena!**

**Tu misión**

1. Importa un script `.py` (o un ejemplo: Archivo ▸ Ejemplos, y luego conviértelo).
2. Cambia un valor y mira en la pestaña 🐍 Código qué líneas han cambiado.
3. Cuando termines, haz clic en «Lo logré».

