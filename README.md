# Preguntas para mi negrita

**Enlace para ella:** https://lordmayes-cyber.github.io/preguntas-para-mi-negrita/

GitHub guarda el código del proyecto y publica el acceso personalizado desde `docs/`. Este acceso abre el cuestionario guardado en Sites, donde la base de datos mantiene las preguntas, las cartas y todo el historial entre dispositivos. GitHub Pages sirve únicamente la página de entrada; la aplicación completa utiliza su servidor en Sites.

El enlace privado de gestión y las respuestas personales no forman parte de este repositorio.

## Entre nosotros

Una página de amor para dos: preguntas editables, enlace para responder sin cuenta, preguntas de una en una, historial de intentos y carta final.

## Uso

Abre la página, escribe los nombres, cambia las preguntas y personaliza la carta. Guarda la sorpresa. El diálogo de compartir entrega dos enlaces: el de tu pareja y tu enlace privado. El enlace privado permite editar y leer todas las respuestas desde cualquier dispositivo. Cada envío completo crea un intento independiente; los anteriores se conservan. No compartas tu enlace privado.

Las preguntas y las respuestas se guardan en D1. El navegador conserva el enlace de gestión y recupera el progreso local del cuestionario. Si se borra el almacenamiento del navegador, el enlace privado permite recuperar el módulo. Las respuestas completadas permanecen en el servidor.

## Desarrollo

- `npm run dev -- --hostname 127.0.0.1 --port 5173`
- `npx tsc --noEmit`
- `node scripts/verify-love.mjs` con la vista local activa y la migración local aplicada.
- El flujo de Sites utiliza `scripts/build-site.mjs` del plugin para compilar.

## Datos y despliegue

La migración inicial `drizzle/0000_curious_spencer_smythe.sql` crea `rooms`, `submissions` y sus índices. Es únicamente aditiva y no modifica datos existentes. Se verifica primero en D1 local y con pruebas del recorrido completo. Sites aplica la misma migración al publicar. Para corregir versiones publicadas se añade una migración posterior; no se modifica la inicial ni se borran respuestas. Una reversión de interfaz conserva las tablas y los datos.

El token de gestión se guarda como hash SHA-256 en el servidor. El enlace privado lleva la clave en el fragmento de URL, separado del enlace de respuesta. La API pública no entrega la carta antes del envío ni permite leer el historial. Una carta completada conserva la versión del texto que existía al enviar ese intento.
