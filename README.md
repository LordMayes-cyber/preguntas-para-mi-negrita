# Preguntas para mi negrita

**Enlace para ella:** https://lordmayes-cyber.github.io/preguntas-para-mi-negrita/

GitHub Pages publica la aplicación completa del navegador desde `docs/`, sin redirecciones ni marcos incrustados. La dirección permanece en `lordmayes-cyber.github.io` durante las preguntas, la carta, los nuevos intentos y la edición. El servicio de datos existente sigue guardando las preguntas, las cartas y el historial entre dispositivos.

Para crear un espacio nuevo: https://lordmayes-cyber.github.io/preguntas-para-mi-negrita/?edit=1

Los enlaces privados incluyen `?edit=1&room=...#key=...`. Los enlaces para responder incluyen únicamente `?room=...`. La raíz abre el cuestionario que ya estaba seleccionado al configurar esta página.

El enlace privado de gestión y las respuestas personales no forman parte de este repositorio.

## Dirección independiente del nombre de GitHub

`vercel-site/` contiene una versión preparada para publicar en un proyecto de Vercel con raíz `vercel-site`. La página utiliza rutas desde `/` y una API del mismo dominio. Los nombres de la cuenta de GitHub y del servicio de datos no aparecen en el código del navegador ni en sus enlaces.

La función `api/rooms.ts` comunica únicamente las operaciones de esta aplicación con el servicio de datos existente. Conserva la autorización privada, las preguntas y el historial; no transfiere cookies ni identifica al visitante con una cuenta de Vercel. El despliegue no requiere migrar la base de datos ni añadir claves al repositorio.

- `npm run build:vercel` actualiza la página en `vercel-site/public/`.
- `npm run test:vercel` verifica las rutas, la autorización y la comunicación con el servicio de datos.
- El proyecto no está publicado en Vercel hasta confirmar su despliegue con una conexión autenticada.

## Entre nosotros

Una página de amor para dos: preguntas editables, enlace para responder sin cuenta, preguntas de una en una, historial de intentos y carta final.

## Uso

Abre la página, escribe los nombres, cambia las preguntas y personaliza la carta. Guarda la sorpresa. El diálogo de compartir entrega dos enlaces: el de tu pareja y tu enlace privado. El enlace privado permite editar y leer todas las respuestas desde cualquier dispositivo. Cada envío completo crea un intento independiente; los anteriores se conservan. No compartas tu enlace privado.

Las preguntas y las respuestas se guardan en D1. El navegador conserva el enlace de gestión y recupera el progreso local del cuestionario. Si se borra el almacenamiento del navegador, el enlace privado permite recuperar el módulo. Las respuestas completadas permanecen en el servidor.

## Desarrollo

- `npm run dev -- --hostname 127.0.0.1 --port 5173`
- `npx tsc --noEmit`
- `npm run build:pages` genera `docs/` para GitHub Pages. La fuente vive en `github-pages/` y comparte los componentes con el servidor.
- `npm run test:pages` comprueba rutas, enlaces privados y la política de acceso entre dominios.
- `node scripts/verify-love.mjs` con la vista local activa y la migración local aplicada.
- El flujo de Sites utiliza `scripts/build-site.mjs` del plugin para compilar.

## Datos y despliegue

La migración inicial `drizzle/0000_curious_spencer_smythe.sql` crea `rooms`, `submissions` y sus índices. Es únicamente aditiva y no modifica datos existentes. Se verifica primero en D1 local y con pruebas del recorrido completo. Sites aplica la misma migración al publicar. Para corregir versiones publicadas se añade una migración posterior; no se modifica la inicial ni se borran respuestas. Una reversión de interfaz conserva las tablas y los datos.

El token de gestión se guarda como hash SHA-256 en el servidor. El enlace privado lleva la clave en el fragmento de URL, separado del enlace de respuesta. La API pública no entrega la carta antes del envío ni permite leer el historial. Una carta completada conserva la versión del texto que existía al enviar ese intento.

La API acepta solicitudes desde el mismo sitio o desde `https://lordmayes-cyber.github.io`. La lectura del historial y las modificaciones siguen requiriendo el token privado; CORS no sustituye la autorización. El navegador de GitHub Pages no envía cookies al servicio de datos. Las respuestas y las claves privadas nunca se incluyen en el código generado de `docs/`.
