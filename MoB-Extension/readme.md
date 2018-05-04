# MoB Extension (Extensión de MoB)

La Extensión de MoB esta desarrollada con HTML5, CSS3 y Javascript. 

---
## Estructura

En el archivo **index.html** se encuentra la interfaz principal de la extensión, funciona como un SPA. La interfaz de la herramienta de segmentación es inyectada más tarde por medio de Javascript.

- En **js/script.js** se encuentra el código principal de la herramienta de segmentación manual de MoB. 
- En **js/mob_leng.js** se encuentra el json con los idiomas de la extensión.
- En **js/background.js** se encuentran los comandos que controlan el pase de mensajes entre la extensión de MoB y la herramienta de segmentación manual de MoB. 
- En **js/popup.js** se encuentra el código Javascript que controla la extensión de MoB. 

---
## Documentación

A continuación se expone una lista de las acciones que se pueden realizar con la herramienta de segmentación manual y la descripción de cada una.

- **Ver información:** es donde puedes observar el progreso de tu segmentación, posee los detalles de los bloques realizados, o los parámetros usados tales como la granularidad.
- **Crear nuevo bloque:** es usada para crear nuevos bloques. Haz clic en el botón para activarlo y después haz clic sobre alguna sección de la página para crear un nuevo bloque.	
- **Eliminar bloque:** es usada para eliminar un bloque. Haz clic en el botón para activarlo y después haz clic en el bloque que deseas eliminar.
- **Unir bloques:** es usada para combinar dos bloques en uno. Haz clic en el botón para activarlo y después haz clic en los dos bloques que deseas combinar.
- **Cortar bloques:** es usada para separar dos bloques que se solapan entre sí. Haz clic en el botón para activarlo, después haz clic sobre el bloque que deseas se preserve sobre el otro, finalmente haz clic sobre el segundo bloque (éste será cortado).
- **Etiquetar bloque:** es usada para agregar una etiqueta a un bloque. Haz click en el botón para activarlo, después haz clic sobre el bloque a etiquetar y elige una etiqueta de la lista.
- **Seleccionar bloque:** es usada para mostrar la información de un bloque. Haz clic en el botón para activarlo, después haz clic sobre algún bloque para observar su información.
- **Enviar segmentación:** es usada para enviar los datos de la segmentación realizada hacia el servidor. Haz click en el botón para enviar la segmentación, en caso de error un mensaje debería aparecer.

---
## Descarga

Puede descargar el archivo en formato **zip** o **crx** aqui: <https://mob.ciens.ucv.ve/downloads>