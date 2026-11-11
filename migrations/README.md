# Migración del catálogo del sitio

El catálogo público y el asistente usan `site_courses` y `site_course_slugs`.
Los 18 cursos inicialmente publicados provienen de los cursos activos del
antiguo `escuela-site/src/data/courses.tsx`. Los cursos comentados no se
importan. `courses` es la tabla anterior del asistente: se conserva intacta,
pero ya no alimenta la API pública ni el asistente.

## Preparación

1. Verificar la versión de MariaDB y probar los archivos en una copia de la
   base de destino. Estos archivos se probaron con MariaDB 11.2. En phpMyAdmin,
   consultar la versión con `SELECT VERSION();`. No ejecutarlos contra otra
   base por accidente.
2. Obtener un respaldo restaurable de toda la base y comprobarlo en una base
   aislada. Respaldar también los archivos de imágenes existentes.
3. Programar una ventana de despliegue. El frontend nuevo necesita que el
   esquema, los datos iniciales y la nueva API estén disponibles antes de
   publicarse.
4. Confirmar que no existan tablas `site_courses`, `site_course_slugs` ni
   `site_catalog_state` de otra aplicación. Si existen, inspeccionarlas y
   resolver las diferencias antes de continuar; `CREATE TABLE IF NOT EXISTS`
   no actualiza automáticamente esquemas existentes.

## Aplicación

Conectarse con un usuario autorizado a la base `escuela` correspondiente y
ejecutar, en este orden, sin usar la opción `--force`:

1. `001_site_courses.sql`: tablas e índice único de slugs.
2. `002_site_courses_data.sql`: inserción del contenido inicial.
3. `003_menu_order.sql`: actualización compatible para instalaciones que ya
   tenían el primer esquema.
4. `004_course_positions.sql`: posiciones independientes por categoría; conserva
   el orden anterior del menú como punto de partida.

Por ejemplo, desde este directorio y verificando previamente el host:

```sh
mariadb -h HOST -u USUARIO -p escuela < 001_site_courses.sql
mariadb -h HOST -u USUARIO -p escuela < 002_site_courses_data.sql
mariadb -h HOST -u USUARIO -p escuela < 003_menu_order.sql
mariadb -h HOST -u USUARIO -p escuela < 004_course_positions.sql
```

La creación y modificación de tablas en MariaDB implica commits implícitos:
si falla alguna instrucción, detener el despliegue y revisar el estado antes
de reintentar. El archivo de datos usa una transacción y no reemplaza cursos
ya migrados; una colisión de slug con otro curso debe fallar. Al reejecutarlo,
conserva los datos editados y los slugs actuales. Verificar 18 cursos y 18
slugs iniciales en una instalación nueva, comparar rutas, contenido e imágenes,
y revisar el menú antes de habilitar la nueva versión. Un catálogo vacío o
parcial no se considera una migración exitosa.

Si la importación de datos falla en phpMyAdmin, detenerse y revisar el error y
el estado de las tablas antes de volver a ejecutar el archivo completo. Si la
sesión sigue abierta y la transacción está activa, ejecutar `ROLLBACK;`. La
sentencia de inserción de cursos usa `FROM DUAL` para compatibilidad con
servidores que requieren `FROM` antes de `WHERE`.

Desplegar primero la API y después el frontend. Configurar `SHOP_IMAGES_DIR`
con la ruta **absoluta** de la carpeta persistente compartida, servida por el
dominio principal como `/images/shop`. En producción corresponde verificar la
ubicación efectiva de `httpdocs/public/images/shop`, los permisos de escritura
de la API y la lectura pública del servidor web. El despliegue del frontend no
debe borrar, reemplazar ni limpiar las imágenes subidas. En desarrollo, si no
se define, la API usa `../escuela-site/public/images/shop`.

Durante el despliegue de posiciones, mantener el ABM sin modificaciones hasta
que estén desplegados tanto la API como el frontend nuevos. Las posiciones
empiezan en 1 y solo cuentan cursos publicados; el servidor desplaza los demás
en la misma transacción y limita posiciones mayores al final de cada lista.

El servidor web debe servir esa carpeta solo como archivos estáticos, con el
tipo MIME correcto y `X-Content-Type-Options: nosniff`, sin ejecutar scripts
desde ella. No se eliminan automáticamente archivos subidos al descartar un
formulario o retirar una imagen: su limpieza requiere revisar las referencias.

Los cambios de slug conservan los anteriores y la SPA navega a la URL
canónica. Las bajas son lógicas. La caché del asistente dura como máximo 24
horas y consulta una revisión compartida en la base; el ABM incrementa esa
revisión en la misma transacción. Las modificaciones manuales directas de las
tablas deben incrementar `site_catalog_state.revision` para invalidar la caché.

## Recuperación

Si el despliegue falla, detener la publicación del frontend nuevo y volver a
las versiones anteriores de API y frontend. No eliminar datos ni tablas para
hacer rollback. Recuperar el respaldo en una base aislada y verificarlo antes
de decidir una restauración; conservar una copia de cualquier cambio realizado
después del respaldo. Las imágenes nuevas no se borran automáticamente al
quitar una imagen de un curso.

## Pruebas aisladas

`npm test` (o `npm run test:catalog`) compila la API y crea un contenedor
temporal de MariaDB, ejecuta las migraciones, inicia la API de prueba y ejecuta
`tests/siteCourses.integration.cjs`. Al finalizar, detiene la API y el contenedor
y elimina el directorio temporal de imágenes. Requiere Docker activo, la imagen
local `mariadb:11.2` y los puertos 33317 y 31317 libres. Si la imagen no está
disponible, obtenerla previamente con `docker pull mariadb:11.2`. No utiliza la
base ni las credenciales de desarrollo.

Los tests del navegador que modifican datos requieren además
`COURSES_E2E_MUTATIONS=1` y los valores aislados documentados en
`e2e/course-administration.spec.ts` del frontend.
`tests/siteCoursePositions.integration.cjs` requiere una base aislada vacía con
las migraciones 001 y 004 y crea cursos de prueba; no debe ejecutarse sobre una
base con datos que se quieran conservar. Para `tests/siteCoursePositions.http.cjs`,
iniciar además la API aislada. `npm run test:positions` ejecuta primero la prueba
de posiciones para crear los cursos de referencia y luego la prueba HTTP. Ambas
pruebas dejan datos de prueba en esa base. `npm test` solo ejecuta las pruebas
del catálogo; las pruebas de posiciones deben ejecutarse por separado en una
base vacía. Ambos comandos compilan antes de ejecutar las pruebas.

Para las pruebas de posiciones, iniciar la API de prueba y ejecutar npm con
estas variables de entorno compartidas (reemplazar la ruta por una carpeta
temporal vacía):

```sh
export NODE_ENV=test DB_HOST=127.0.0.1 DB_PORT=33317 DB_NAME=escuela_test
export DB_USER=root DB_PASSWORD=temporary-test-only PORT=31317
export JWT_SECRET=course-test-secret ALLOWED_DOMAIN=example.test
export GOOGLE_CLIENT_ID=test.apps.googleusercontent.com SITE_URL=http://localhost:5173
export RESEND_API_KEY=test EMAIL_TO=test@example.test EMAIL_FROM=test@example.test
export HASH_SECRET=test CSRF_SECRET=isolated-test-only
export SHOP_IMAGES_DIR=/ruta/absoluta/a/carpeta/temporal
```

La base aislada debe aceptar esas credenciales. El comando de posiciones no
crea ni detiene la base o la API: deben prepararse y arrancarse por separado.

Se verificaron instalación y build con Node 21.7.3 usando
`npm ci --engine-strict`. Node 21 está fuera de soporte; las auditorías de npm
siguen reportando vulnerabilidades en dependencias preexistentes y herramientas
de desarrollo. Revisarlas antes de publicar y planificar una actualización a
una versión de Node con soporte, porque no todas tienen soluciones compatibles
con Node 21.
