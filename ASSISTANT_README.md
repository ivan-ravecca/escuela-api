# Asistente de orientación académica

El asistente utiliza Anthropic para responder consultas y recomendar hasta tres
cursos publicados. El catálogo proviene de MariaDB (`site_courses` y
`site_course_slugs`), no de SQLite ni de un servidor MCP. El frontend permite
enviar una solicitud de contacto por curso mediante Resend.

El mensaje inicial hace una pregunta breve. Las respuestas posteriores buscan
recomendar opciones en cuanto el interés sea claro y se limitan a dos preguntas
de seguimiento; los requisitos no confirmados se indican sin darlos por cumplidos.
La API revisa los signos de interrogación de la respuesta y reintenta una vez si
el modelo excede el límite. Las preguntas formuladas sin signos dependen del
cumplimiento de las instrucciones por parte del modelo.

## Configuración y despliegue

1. Aplicar las migraciones del catálogo según [migrations/README.md](./migrations/README.md)
   y comprobar que la API puede conectarse a MariaDB.
2. Configurar `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_MAX_TOKENS`,
   `SITE_URL`, `RESEND_API_KEY`, `EMAIL_TO`, `EMAIL_FROM` y `CSRF_SECRET` en
   el entorno seguro de la API. No guardar claves reales en el repositorio.
   `SITE_URL` debe apuntar al dominio público del sitio.
3. Verificar que CORS permite el origen del frontend con credenciales, que el
   navegador acepta la cookie CSRF y que el proxy conserva correctamente el
   origen y protocolo HTTPS. En producción, el CORS actual permite los
   dominios de escuelaenfermeria.com.uy; no asume que `SITE_URL` cambie esa
   lista.
4. Desplegar la API y, cuando esté lista, construir y desplegar el frontend con
   `VITE_ENABLE_AI=true`. La variable de Vite se incorpora en la compilación;
   el widget permanece oculto con cualquier otro valor. La API puede arrancar
   sin la clave de Anthropic, pero no puede responder mensajes hasta configurarla
   y reiniciar el proceso.

Las conversaciones y el catálogo se envían a Anthropic para generar respuestas;
los datos del formulario se envían a Resend para notificar al equipo.

## Catálogo y caché

Cada proceso de la API mantiene una copia en memoria de los cursos publicados.
En cada mensaje consulta `site_catalog_state.revision`; solo vuelve a leer el
catálogo completo si la revisión cambia o la copia cumple 24 horas. Las
solicitudes concurrentes comparten la recarga. El ABM incrementa la revisión
en la misma transacción de cada cambio, por lo que las instancias detectan los
cambios en sus siguientes consultas. Una modificación directa de base debe
incrementar esa revisión.

Si la lectura de la revisión o la recarga falla, se registra el error y se
utiliza la última copia correcta durante un máximo de 24 horas desde su carga.
La respuesta incluye `catalog_stale: true` para mostrar el aviso al usuario.
Puede contener cursos que se despublicaron posteriormente. Sin copia válida,
incluido un reinicio con la base fuera de servicio, el endpoint devuelve 503
con `code: "CATALOG_UNAVAILABLE"` y no consulta a Anthropic. La caché no se
comparte entre procesos ni sobrevive a reinicios.

## Endpoints

- `GET /assistant/welcome`: mensaje de bienvenida.
- `GET /assistant/csrf-token`: obtiene el token y la cookie de protección.
- `POST /assistant/chat`: recibe `message` y `conversation_history`; devuelve
  `response`, `recommended_courses` y `catalog_stale`. Límite: 10 solicitudes
  por minuto por IP.
- `POST /assistant/interest`: recibe `name`, `phone`, `email`, `course_id` y
  `course_name` y envía el contacto por correo. Límite: 3 solicitudes por hora
  por IP.

Las solicitudes POST requieren la cookie CSRF y el encabezado `X-CSRF-Token`.
El frontend envía credenciales y renueva el token al recibir una respuesta
403. La validación y los límites aplican también cuando el widget está oculto.

## Pruebas

`npm run test:catalog` ejecuta pruebas de caché y del asistente con el proveedor
simulado, seguidas de integración con MariaDB y API aisladas. Requiere Docker,
la imagen local `mariadb:11.2` y los puertos de prueba disponibles; no llama a
Anthropic ni utiliza la base real. La prueba del widget se documenta en el
repositorio del frontend.
