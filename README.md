# ShipNow API — Estructura profesional (M1) + Mocking (M2) + Errores (M3) + Logging (M4) + Swagger (M5) + Testing (M6) + Carga de archivos (M7) + Performance, producción y Docker (M8)

Refactorización de la API base de ShipNow a arquitectura por capas
(Controller → Service → Repository) más una capa de configuración
de entorno validada, un módulo de mocking para generar datos de
prueba (usuarios, repartidores, pedidos y entregas), una capa
centralizada de manejo de errores, un sistema de logging
profesional con Winston conectado a esa capa de errores,
documentación interactiva de la API con Swagger/OpenAPI, una
suite de tests funcionales automatizados con Mocha, Chai y
Supertest, carga de archivos con Multer (documentos de usuario
y comprobantes de entrega) integrada a todas las capas anteriores,
y un último módulo que prepara todo esto para un entorno más
cercano a producción: paginación en los listados, configuración
por entorno reforzada, un health check, y la API contenerizada
con Docker.

> **Nota sobre este módulo:** la consigna del Módulo 5 pide documentar
> los tags Users, Orders, Deliveries, Mocks y Logger. Hasta el Módulo 4
> el proyecto tenía modelos de `Order` y `Delivery` (usados por el
> módulo de mocks) pero sin endpoints CRUD propios. Para poder
> documentarlos de verdad —y no inventar en Swagger algo que la API no
> hacía— se agregaron los endpoints reales de `Orders` y `Deliveries`
> (mismo patrón Controller → Service → Repository que Products/Users)
> en este mismo módulo. También se documentó `Products`, que ya existía
> pero no estaba en la lista de tags pedida.

## Estructura

```
src/
  config/
    env.config.js      -> validación y export de variables de entorno
    logger.config.js   -> configuración centralizada de Winston (niveles, formato, transports)
    swagger.config.js  -> configuración centralizada de Swagger/OpenAPI (separada de las rutas)
    multer.config.js   -> configuración centralizada de Multer (Módulo 7, separada de las rutas)
  docs/             -> SOLO documentación (bloques JSDoc @openapi), sin lógica:
    schemas.docs.js    -> schemas reutilizables (User, Product, Order, Delivery, FileMetadata, ErrorResponse, etc.)
    products.docs.js, users.docs.js, orders.docs.js,
    deliveries.docs.js, mocks.docs.js, logger.docs.js -> paths por módulo (uno por tag)
  constants/      -> valores inmutables del dominio (roles, estados, prioridades, config de uploads, paginación)
  errors/         -> AppError base, diccionario de errores y errores de dominio
  utils/
    pagination.js -> parsea/valida page y limit, y arma los metadatos de paginación (Módulo 8)
  middlewares/
    error.middleware.js      -> middleware global de manejo de errores (logueado con Winston)
    httpLogger.middleware.js -> loguea cada request (nivel http)
  models/         -> esquemas de Mongoose (sin lógica de negocio)
    fileMetadata.schema.js -> subdocumento reutilizable de metadatos de archivo (Módulo 7)
  repositories/   -> único lugar que conoce Mongoose/MongoDB
  services/       -> lógica de negocio, valida y lanza errores de dominio
  controllers/    -> gestiona req/res, llama al service y delega errores con next(err)
    health.controller.js -> health check de la API (Módulo 8)
  routes/         -> conecta cada path con su método del controller (SIN nada de Swagger acá)
  app.js          -> configuración de Express + middlewares globales + monta Swagger UI (solo fuera de producción)
  server.js       -> punto de entrada, conecta a Mongo y levanta el server
logs/             -> archivos de logs generados por Winston (no se versionan, ver .gitignore)
uploads/          -> archivos subidos por Multer (Módulo 7); estructura versionada
                     con .gitkeep, contenido no versionado (ver .gitignore)
  documentos-usuario/   -> documentos de usuario (DNI, licencia, etc.)
  comprobantes-entrega/ -> comprobantes asociados a una entrega
test/             -> suite de tests funcionales (Mocha + Chai + Supertest, Módulo 6)
  setup.js            -> root hooks: conecta/limpia/desconecta la base de testing
  helpers/fixtures.js -> datos de prueba controlados y repetibles (usuarios, pedidos, etc.)
  helpers/testFiles.js -> buffers de archivo en memoria para los tests de carga (Módulo 7)
  *.test.js           -> un archivo de tests por módulo de endpoints
Dockerfile          -> imagen de producción, multi-stage (Módulo 8)
.dockerignore       -> archivos que nunca entran a la imagen (Módulo 8)
docker-compose.yml  -> API + MongoDB con un solo comando, para probar todo local (Módulo 8)
```

## Cómo correrlo localmente

1. Instalar dependencias:
   ```
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar los valores reales:
   ```
   cp .env.example .env
   ```
3. Levantar el servidor:
   ```
   npm run dev
   ```
   Si falta `MONGODB_URI`, `LOG_LEVEL` (o cualquier otra variable
   obligatoria), o si alguna tiene un valor no permitido (`NODE_ENV` que
   no sea `development`/`test`/`production`, `LOG_LEVEL` que no sea uno
   de los 6 niveles válidos, `PORT` que no sea un entero positivo), la
   app tira un error descriptivo al arrancar y **no levanta el
   servidor** (ver "Preparación para producción" más abajo).

También se puede correr con Docker (imagen sola o el stack completo con
Mongo incluido vía `docker-compose`); ver "Performance, preparación
para producción y Docker (Módulo 8)" más abajo.

## Manejo de errores (Módulo 3)

Todos los errores de la API responden con la misma estructura, generada
**únicamente** por el middleware global (`src/middlewares/error.middleware.js`).
Ninguna ruta ni controller arma una respuesta de error por su cuenta: siempre
llaman a `next(err)` y ahí termina su responsabilidad.

**Estructura de respuesta uniforme:**
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuario no encontrado",
    "details": { "id": "64f0c2..." }
  }
}
```
`details` es opcional y solo aparece cuando aporta contexto útil (ids, valores
recibidos, campos faltantes, etc.).

**De dónde salen los errores:**
- `src/errors/error.dictionary.js` — diccionario único con el `statusCode` y
  mensaje de cada código de error posible.
- `src/errors/AppError.js` — clase base que arma el error a partir de un
  código del diccionario.
- `src/errors/domainErrors.js` — errores concretos del dominio:
  `UserNotFoundError`, `ProductNotFoundError`, `OrderNotFoundError`,
  `DeliveryNotFoundError`, `InvalidStatusError`, `InvalidRoleError`,
  `ValidationError`, `ForbiddenError`, `InvalidMockQuantityError`,
  `DatabaseError`.
- Los **Services** son quienes detectan la condición de error y lanzan
  (`throw`) la clase correspondiente. Los Controllers solo capturan con
  `try/catch` y hacen `next(err)`.

**Casos que podés probar:**

| Caso | Cómo probarlo | Respuesta esperada |
|---|---|---|
| Producto/usuario inexistente | `GET /api/products/64f0000000000000000000aa` (id válido pero que no existe) | 404 `PRODUCT_NOT_FOUND` |
| ID con formato inválido | `GET /api/products/abc123` | 400 `VALIDATION_ERROR` (capturado por Mongoose `CastError`) |
| Faltan campos obligatorios | `POST /api/products` con body `{}` | 400 `VALIDATION_ERROR` |
| Ruta inexistente | `GET /api/no-existe` | 404 `ROUTE_NOT_FOUND` |
| **Mocks: cantidad negativa** | `GET /api/mocks?users=-3` | 400 `INVALID_MOCK_QUANTITY` |
| **Mocks: cantidad no numérica** | `GET /api/mocks?users=abc` | 400 `INVALID_MOCK_QUANTITY` |
| **Mocks: cantidad fuera de rango** | `POST /api/mocks/seed` con `{"users": 500}` | 400 `INVALID_MOCK_QUANTITY` (el límite es 1-50) |
| **Mocks: falla de MongoDB** | Apagá momentáneamente la conexión a Mongo y llamá a `POST /api/mocks/seed` | 500 `DATABASE_ERROR` |

Ejemplo con curl (PowerShell):
```
curl.exe "http://localhost:3000/api/mocks?users=-3"
```
Respuesta:
```json
{
  "error": {
    "code": "INVALID_MOCK_QUANTITY",
    "message": "La cantidad de datos mock solicitada no es válida",
    "details": { "field": "users", "received": -3, "rule": "Debe ser un entero entre 1 y 50" }
  }
}
```

## Logging y monitoreo (Módulo 4)

Toda la aplicación usa un **logger centralizado con Winston**
(`src/config/logger.config.js`) en lugar de `console.log()` sueltos.
Cualquier archivo que necesite loguear algo importa ese mismo módulo:

```js
const logger = require('../config/logger.config');
logger.info('Algo pasó');
```

**Niveles de log (de más a menos grave):**

| Nivel | Uso |
|---|---|
| `fatal` | Falla crítica que impide arrancar el servidor (ej: no se pudo conectar a Mongo al iniciar) |
| `error` | Error inesperado del servidor (bug real, no un error de negocio) |
| `warning` | Error esperado del negocio (`AppError`): recurso no encontrado, validación fallida, cantidad de mock inválida, etc. |
| `info` | Evento informativo relevante: servidor iniciado, conexión a Mongo, datos mock generados con éxito |
| `http` | Una línea por cada request entrante (método, path, status, duración) |
| `debug` | Detalle interno, solo útil en desarrollo |

**Comportamiento según el entorno** (usa la misma variable `NODE_ENV`
del Módulo 1, validada en `env.config.js`):
- **`development`**: la consola muestra **todos** los niveles, incluido `debug`.
- **`production`**: la consola solo muestra `info`, `warning`, `error` y `fatal`
  (se omiten `debug` y `http` para no saturar los logs).

**Dónde se usa el logger:**
- `server.js` — arranque del servidor (`info`), conexión a MongoDB (`info`
  si conecta, `fatal` si falla al arrancar, `error` si se cae después de
  haber arrancado).
- `server.js` — además, captura `uncaughtException` y `unhandledRejection`
  a nivel de proceso: cualquier error que escape de Express se loguea
  como `fatal` con su stack, y recién ahí se corta el proceso con
  `process.exit(1)`.
- `middlewares/httpLogger.middleware.js` — loguea cada request (`http`).
- `middlewares/error.middleware.js` — todo error que pasa por acá se
  loguea: los `AppError` (negocio) como `warning`, y cualquier error no
  anticipado como `error` (con el stack completo).
- `app.js` — la ruta inexistente (404) se loguea como `warning` con
  método y path, antes de responder al cliente.
- `services/mock.service.js` — generación de preview (`debug`) y
  seed exitoso en MongoDB (`info`); si falla la inserción, se loguea
  como `error` antes de traducirse a un `DatabaseError`.

**Persistencia en archivos y rotación:**

Los niveles `error` y `fatal` se guardan además en archivos dentro de
`logs/`, con rotación diaria (`winston-daily-rotate-file`):
- Un archivo nuevo por día: `logs/error-YYYY-MM-DD.log`.
- Se conservan 14 días de historial (`maxFiles: '14d'`); los archivos
  más viejos se eliminan automáticamente.
- Los archivos rotados se comprimen (`zippedArchive: true`).
- **Solo** quedan ahí los niveles `error` y `fatal` — ni `warning`, ni
  `info`, ni `debug` (esos solo van a consola).

La carpeta `logs/` está versionada (con un `.gitkeep`) para que quede
documentada, pero los archivos `.log` y `.log.gz` que genera la app
**no** se suben al repo (ver `.gitignore`).

**Endpoint de prueba del logger:**

> **No disponible en producción** (`NODE_ENV=production`): ver
> "Criterio sobre endpoints internos" en el Módulo 8, más abajo.

`GET /api/logger/test` — endpoint interno, sin lógica de negocio, que
dispara un log de cada uno de los 6 niveles. Sirve para verificar
rápidamente que la configuración funciona:

```
curl.exe http://localhost:3000/api/logger/test
```

Después de llamarlo, revisá:
- La consola (todos los niveles en desarrollo).
- `logs/error-YYYY-MM-DD.log` (debería tener solo las líneas de
  `error` y `fatal` de esa prueba).

## Documentación de la API con Swagger (Módulo 5)

La API expone documentación interactiva (Swagger UI) donde se puede
consultar **y probar** cada endpoint directamente desde el navegador:

```
http://localhost:3000/api/docs
```

(cambiá `3000` si usás otro `PORT` en tu `.env`).

**Separación de responsabilidades:**
- `src/config/swagger.config.js` es el ÚNICO archivo que arma la
  especificación OpenAPI (info general, servers, tags) y monta Swagger
  UI sobre la app (`setupSwagger(app)`, llamado una sola vez desde
  `app.js`).
- Ningún archivo de `routes/` o `controllers/` importa Swagger. Toda la
  documentación de cada endpoint vive en `src/docs/*.docs.js`: archivos
  que **solo contienen comentarios JSDoc** (`@openapi`), sin lógica de
  rutas real. `swagger.config.js` le indica a `swagger-jsdoc` que
  escanee ese glob (`src/docs/*.docs.js`), nunca los archivos de rutas.

**Módulos documentados (tags):**

| Tag | Archivo de docs | Endpoints |
|---|---|---|
| `Products` | `products.docs.js` | CRUD completo de productos |
| `Users` | `users.docs.js` | CRUD completo de usuarios |
| `Orders` | `orders.docs.js` | Listar, ver, crear, cambiar estado y eliminar pedidos |
| `Deliveries` | `deliveries.docs.js` | Listar, ver, crear, cambiar estado y eliminar entregas |
| `Mocks` | `mocks.docs.js` | Previsualizar (`GET /mocks`) e insertar (`POST /mocks/seed`) datos de prueba |
| `Logger` | `logger.docs.js` | `GET /logger/test`, marcado explícitamente como herramienta interna, no funcionalidad de negocio |

**Schemas reutilizables** (`src/docs/schemas.docs.js`, referenciados
con `$ref` desde todos los demás): `User`, `UserInput`, `Product`,
`Order`, `OrderInput`, `OrderItem`, `OrderStatusInput`, `Delivery`,
`DeliveryInput`, `DeliveryStatusInput`, `ErrorResponse` y
`SuccessResponse`. También hay `responses` reutilizables
(`NotFound`, `ValidationError`, `InvalidStatus`, `InternalError`) para
no repetir la misma forma de error una y otra vez.

**Errores documentados** (coinciden con lo que la API devuelve
realmente, ver `errors/error.dictionary.js`):
- `VALIDATION_ERROR` (400) — datos inválidos o campos faltantes.
- `*_NOT_FOUND` (404) — usuario, producto, pedido o entrega no encontrado.
- `INVALID_STATUS` (400) — estado inválido al crear/actualizar pedidos o entregas.
- `INVALID_MOCK_QUANTITY` (400) — cantidad inválida en los endpoints de mocks.
- `DATABASE_ERROR` / `INTERNAL_ERROR` (500) — errores no anticipados del servidor.

No se documentó autenticación porque la API no la implementa (no hay
login ni tokens); tampoco se documentó `INVALID_ROLE`, ya que existe
en el diccionario de errores pero ningún endpoint actual lo dispara.

**Para probarlo:** entrá a `/api/docs`, abrí cualquier endpoint, click
en "Try it out", completá los parámetros/body y "Execute". Como la API
necesita Mongo corriendo, para probar creaciones/lecturas reales lo
más rápido es primero pegarle a `POST /api/mocks/seed` desde el propio
Swagger UI para tener usuarios/pedidos/entregas de prueba, y después
usar esos IDs en los demás endpoints.

## Testing funcional (Módulo 6)

Suite de tests funcionales automatizados que ejercitan la API real
(vía HTTP, con `supertest`) contra una base de MongoDB de testing,
separada por completo de la de desarrollo.

**Herramientas usadas:**
- **Mocha** — organiza y ejecuta los tests (`describe`/`it`), y define
  los *root hooks* globales de conexión/limpieza de la base.
- **Chai** (`expect`) — hace las aserciones sobre status code y forma
  del body de cada respuesta.
- **Supertest** — dispara las peticiones HTTP contra la app de Express
  (`src/app.js`) importada directamente, **sin** necesidad de que el
  servidor esté corriendo ni de abrir un puerto real.

**Cómo ejecutar los tests:**

1. Copiar `.env.test.example` a `.env.test` y completar `MONGODB_URI`
   con una base **de testing**, distinta a la de desarrollo (el nombre
   de la base debe contener `test`; `test/setup.js` lo valida como red
   de seguridad antes de tocar cualquier dato):
   ```
   cp .env.test.example .env.test
   ```
2. Correr la suite completa:
   ```
   npm test
   ```
   Esto ejecuta `mocha` con `NODE_ENV=test` (vía `cross-env`), lo que
   hace que `env.config.js` cargue `.env.test` en vez de `.env`.

**¿Se requiere una base de datos de testing?** Sí. Los tests necesitan
una instancia de MongoDB corriendo (local o remota) apuntada por la
`MONGODB_URI` de `.env.test`. Antes de cada test se parte de una base
limpia: `test/setup.js` borra el contenido de todas las colecciones
**después de cada test** (no antes ni después de cada archivo), así
ningún test depende del orden en que Mocha decida correrlos ni de
datos dejados por otro test. Los datos que cada test necesita como
precondición (por ejemplo, un usuario válido antes de crear un pedido)
se crean puntualmente con los helpers de `test/helpers/fixtures.js`,
nunca se asume que ya existen cargados a mano.

**Variables de entorno necesarias (`.env.test`):**
| Variable | Descripción |
|---|---|
| `PORT` | No se usa realmente (los tests no levantan el server), pero es obligatoria por `env.config.js`. |
| `MONGODB_URI` | Conexión a la base de MongoDB de **testing** (debe contener `test` en el nombre). |
| `NODE_ENV` | Debe ser `test`. Lo setea automáticamente el script `npm test`. |

**Módulos y endpoints cubiertos:**

| Archivo | Endpoints | Casos exitosos | Casos de error |
|---|---|---|---|
| `test/users.test.js` | `GET /api/users`, `GET /api/users/:id` | Listado paginado (vacío y con usuarios, sin exponer `password`), `?page=`/`?limit=` | `USER_NOT_FOUND` (404), `VALIDATION_ERROR` (400, `limit` fuera de rango) |
| `test/orders.test.js` | `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, `PATCH /api/orders/:id/status` | Listar (paginado), ver por ID, crear con datos válidos, actualizar a un estado válido | `VALIDATION_ERROR` (400, datos incompletos o `page` inválido), `ORDER_NOT_FOUND` (404), `INVALID_STATUS` (400) |
| `test/mocks.test.js` | `GET /api/mocks`, `POST /api/mocks/seed` | Preview en memoria (no persiste nada) y seed real en Mongo | `INVALID_MOCK_QUANTITY` (400, cantidad negativa o no numérica) |
| `test/logger.test.js` | `GET /api/logger/test` | Dispara los 6 niveles de log y devuelve el resumen esperado | — |
| `test/docs.test.js` | `GET /api/docs` | Sirve la interfaz de Swagger UI (`text/html`) | — |
| `test/health.test.js` | `GET /api/health` | Devuelve `status`/`environment`/`uptime`/`timestamp`, sin exponer `MONGODB_URI` (Módulo 8) | — |
| `test/notFound.test.js` | Cualquier ruta no manejada | — | `ROUTE_NOT_FOUND` (404), coherente con lo documentado en Swagger |
| `test/uploads.test.js` | `POST /api/users/:id/documents`, `POST /api/deliveries/:id/proof` | Carga correcta de un documento de usuario y de un comprobante de entrega, con metadatos registrados | `FILE_REQUIRED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `INVALID_DOCUMENT_TYPE`, `USER_NOT_FOUND`, `DELIVERY_NOT_FOUND` |

> **Nota (Módulo 8):** `products.test.js` y `deliveries.test.js` no
> existían antes de este módulo y siguen sin un archivo dedicado; sus
> endpoints de listado se paginaron con el mismo mecanismo y los mismos
> criterios que `users`/`orders` (ver `utils/pagination.js`), verificado
> manualmente. Queda como deuda técnica agregarles cobertura propia en
> una futura entrega.

Cada test valida el status HTTP **y** la estructura del body (incluyendo,
en los errores, el `code` definido en `errors/error.dictionary.js` y,
cuando corresponde, el campo `details`), nunca solo que el endpoint
"responda" o "falle".

## Carga de archivos con Multer (Módulo 7)

La API permite subir documentos y comprobantes vía `multipart/form-data`,
validarlos, guardarlos en carpetas organizadas del servidor y asociar
sus metadatos a una entidad existente (usuario o entrega). El archivo
en sí **nunca** se guarda en MongoDB: la base solo conoce su nombre
original, nombre generado, ruta, tipo, tamaño, tipo de documento y
fecha de carga (ver schema `FileMetadata` en `/api/docs`).

**Configuración centralizada** (`src/config/multer.config.js`, separada
por completo de `routes/`):
- Define dónde se guarda cada archivo (`uploads/documentos-usuario/`
  y `uploads/comprobantes-entrega/`, creadas automáticamente al
  arrancar la app si no existen).
- Genera nombres únicos (`timestamp-random.ext`), nunca reutiliza el
  nombre original del archivo.
- Restringe los tipos aceptados (`application/pdf`, `image/jpeg`,
  `image/png`) y el tamaño máximo (5 MB) — ambos configurables en
  `constants/index.js` (`FILE_UPLOAD`).
- Expone `handleMulterError`, un middleware que traduce los errores de
  Multer (tamaño excedido, campo inesperado) al formato de error único
  del proyecto, y `deleteUploadedFile`, usado por los controllers para
  borrar un archivo ya guardado en disco si una validación posterior
  (entidad inexistente, tipo de documento inválido) lo rechaza — así
  nunca queda un archivo huérfano sin asociar a su entidad.

**Endpoints:**

- `POST /api/users/:id/documents` — sube un documento de usuario.
  Campos del `multipart/form-data`:
  - `file` (requerido): el archivo.
  - `documentType` (requerido): `DNI`, `LICENCIA` u `OTRO`.

  Verifica que el usuario exista, valida el archivo (tipo y tamaño,
  vía Multer) y el `documentType` (vía el Service), y agrega el
  metadato al array `documents` del usuario. Devuelve el usuario
  actualizado (201).

- `POST /api/deliveries/:id/proof` — sube un comprobante asociado a
  una entrega. Campo del `multipart/form-data`:
  - `file` (requerido): el archivo.

  Verifica que la entrega exista, valida el archivo, y agrega el
  metadato al array `proofs` de la entrega (es un array porque una
  entrega puede tener más de un comprobante, por ejemplo tras un
  reintento). Devuelve la entrega actualizada (201).

**Errores específicos** (mismo formato uniforme que el resto de la API):

| Código | Status | Cuándo ocurre |
|---|---|---|
| `FILE_REQUIRED` | 400 | No se adjuntó ningún archivo en el campo `file`. |
| `INVALID_FILE_TYPE` | 400 | El mimetype del archivo no está permitido (solo PDF/JPG/PNG). |
| `FILE_TOO_LARGE` | 400 | El archivo supera los 5 MB. |
| `INVALID_FILE_FIELD` | 400 | El archivo llegó en un campo distinto a `file`. |
| `INVALID_DOCUMENT_TYPE` | 400 | `documentType` no es `DNI`, `LICENCIA` ni `OTRO`. |
| `USER_NOT_FOUND` / `DELIVERY_NOT_FOUND` | 404 | La entidad indicada en la URL no existe. |
| `FILE_UPLOAD_ERROR` | 500 | Falla real al guardar el archivo (ej. error de disco). |

**Logging:** cada carga exitosa (`Documento de usuario cargado
correctamente`, `Comprobante asociado a la entrega correctamente`) se
loguea en `info`; un intento con un tipo de archivo no permitido se
loguea en `warning` desde el propio `fileFilter` de Multer; y
cualquier error de carga (`AppError` o inesperado) queda registrado
por el middleware global de errores, igual que el resto de la API.

**Cómo probarlo con curl (PowerShell):**
```
curl.exe -X POST "http://localhost:3000/api/users/<ID_DE_UN_USUARIO>/documents" `
  -F "documentType=DNI" `
  -F "file=@C:\ruta\a\tu\archivo.pdf;type=application/pdf"
```
O directamente desde `/api/docs` (Swagger UI), donde ambos endpoints
están documentados como `multipart/form-data` con "Try it out".

**Tests funcionales** (`test/uploads.test.js`): carga correcta de un
documento de usuario y de un comprobante de entrega, error sin
archivo, error con tipo de archivo no permitido, error con archivo
demasiado grande, error con `documentType` inválido y error cuando la
entidad (usuario o entrega) no existe. Usa `test/helpers/testFiles.js`
para adjuntar buffers en memoria (sin archivos temporales en disco) y
limpia después de cada test los archivos reales que la app haya
guardado en `uploads/`.

## Performance, preparación para producción y Docker (Módulo 8)

Último módulo: prepara el proyecto para un entorno más cercano a
producción, sobre tres ejes.

### 1. Performance

**Paginación en los listados** (`src/utils/pagination.js`): ningún
endpoint de listado (`GET /api/products`, `/api/users`, `/api/orders`,
`/api/deliveries`) devuelve la colección completa sin control. Todos
aceptan `?page=` (default `1`) y `?limit=` (default `20`, **máximo
100** aunque se pida más), y devuelven:
```json
{
  "data": [ /* items de esta página */ ],
  "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```
`page`/`limit` inválidos (no enteros, `page < 1`, `limit` fuera de
1–100) devuelven 400 `VALIDATION_ERROR`, igual que cualquier otro dato
mal formado en la API. La validación vive en un único lugar
(`utils/pagination.js`), la usan los 4 Controllers, y cada Repository
resuelve la página con `.skip()/.limit()` **más** un `countDocuments()`
sobre el mismo filtro (para que `totalPages` sea siempre coherente con
lo que se puede paginar).

**Otros puntos ya cubiertos desde módulos anteriores** (se revisaron,
no se tocaron):
- Carga de archivos con límites: tamaño máximo (5 MB), tipos
  restringidos (`FILE_UPLOAD` en `constants/index.js`), errores
  controlados (`handleMulterError`), y los archivos se guardan **fuera**
  de `src/`, en `uploads/`, nunca como "almacenamiento permanente sin
  criterio" (son metadatos + archivo en disco, no un blob en Mongo).
- Body JSON con límite explícito (`express.json({ limit: '1mb' })`,
  Módulo 8): antes no tenía límite explícito (quedaba en el default de
  Express, 100kb, pero sin que quedara documentado como una decisión).
- No hay queries sin filtro fuera de los listados ya paginados, ni
  logs excesivos (Winston ya diferenciaba niveles desde el Módulo 4), ni
  operaciones síncronas que bloqueen el Event Loop (toda la app es
  async/await sobre Mongoose; Multer procesa los uploads a disco de
  forma asincrónica).

### 2. Preparación para producción

**Variables de entorno** (`src/config/env.config.js`), separadas por
archivo según el entorno (`.env` para development, `.env.test` para
testing — ninguno de los dos se versiona, ver `.gitignore`):

| Variable | Obligatoria | Valores válidos | Para qué |
|---|---|---|---|
| `PORT` | Sí | Entero positivo | Puerto donde escucha el servidor |
| `MONGODB_URI` | Sí | — | Conexión a MongoDB |
| `NODE_ENV` | Sí | `development`, `test`, `production` | Entorno de ejecución |
| `LOG_LEVEL` | Sí | `fatal`, `error`, `warning`, `info`, `http`, `debug` | Techo de logs de Winston (Módulo 8; antes salía de un `if (NODE_ENV === 'production')` hardcodeado) |

**Sobre las dos variables que la consigna pide "si aplica" y no están
en la lista:** secreto de JWT y URLs de servicios externos no aplican
hoy — la API no implementa autenticación (no hay login ni tokens en
ningún endpoint) y no integra con ningún servicio de terceros. El día
que se agregue cualquiera de las dos, se sumarían acá como variables
obligatorias, nunca hardcodeadas en el código; queda documentado para
que la ausencia sea una decisión explícita y no un descuido.

`.env.example` y `.env.test.example` están actualizados con las 4
variables (incluida `LOG_LEVEL`, agregada en este módulo) y comentarios
sobre qué valor usar en cada caso.

**Validación al arrancar:** si falta alguna variable obligatoria, o si
`NODE_ENV`/`LOG_LEVEL` no tienen uno de sus valores válidos, o si
`PORT` no es un entero positivo, `env.config.js` tira un error
descriptivo y **el proceso no arranca** (falla rápido, con un mensaje
claro de qué variable está mal y qué valores acepta — no un stack trace
genérico de Mongoose intentando conectar a una URI vacía).

**Health check:** `GET /api/health`, disponible en **todos** los
entornos (a diferencia de `/mocks` y `/logger/test`, ver abajo).
Devuelve estado del proceso, entorno, uptime y timestamp — **sin**
exponer `MONGODB_URI` ni ningún otro detalle de infraestructura:
```json
{ "status": "ok", "environment": "production", "uptime": 12345.67, "timestamp": "2026-09-02T19:00:00.000Z" }
```
`status` es `"degraded"` (con HTTP 503) si el proceso está vivo pero
Mongo no está conectado en ese momento — así un orquestador (o el
`HEALTHCHECK` del propio Dockerfile) puede diferenciar "el contenedor
no arrancó" de "arrancó pero no puede hablar con la base".

**Criterio sobre endpoints internos en producción** (`GET /api/mocks`,
`POST /api/mocks/seed`, `GET /api/logger/test`, y Swagger UI en
`/api/docs`): se **desmontan por completo** cuando `NODE_ENV=production`
(`routes/index.js` y `app.js` los excluyen condicionalmente antes de
montar las rutas). Una request a cualquiera de esos paths en producción
cae en el 404 genérico `ROUTE_NOT_FOUND`, sin revelar que alguna vez
existieron. Fuera de producción (`development`/`test`) siguen
disponibles sin restricciones — de hecho los tests de `mocks.test.js`,
`logger.test.js` y `docs.test.js` corren con `NODE_ENV=test` y siguen
pasando igual que antes.

Motivo de la decisión: `POST /api/mocks/seed` **escribe** datos falsos
en la base (peligroso en producción), `GET /api/logger/test` es puro
ruido de diagnóstico, y Swagger UI expone la forma completa de la API
(paths, schemas, ejemplos) sin aportarle nada a un cliente real en
producción. `GET /api/mocks` (el preview en memoria, que no escribe
nada) se desmontó junto con `seed` por simplicidad: viven bajo el mismo
Router y la misma razón de ser ("herramienta de day-to-day dev", no
funcionalidad de negocio).

**Cómo verificarlo:** con `NODE_ENV=production` en el `.env` (y
`MONGODB_URI`/`LOG_LEVEL` válidos), levantar el server y confirmar:
```
curl.exe http://localhost:3000/api/health          # 200, status "ok"
curl.exe http://localhost:3000/api/docs             # 404 ROUTE_NOT_FOUND
curl.exe http://localhost:3000/api/mocks            # 404 ROUTE_NOT_FOUND
curl.exe http://localhost:3000/api/logger/test      # 404 ROUTE_NOT_FOUND
```

### 3. Docker

**`Dockerfile`** (multi-stage):
1. Stage `deps`: instala **solo** dependencias de producción (`npm ci
   --omit=dev`, sin Mocha/Chai/Supertest/nodemon/cross-env) — separado
   en su propio stage para aprovechar la cache de Docker entre builds.
2. Stage `runner`: parte de `node:22-alpine`, copia el `node_modules`
   ya resuelto del stage anterior más `src/` y `package.json`, crea las
   carpetas `logs/` y `uploads/*` con ownership del usuario `node`
   (no-root, ya incluido en la imagen base), y corre la app con `node
   src/server.js` (mismo script que `npm start`) **sin privilegios de
   root**.
3. Expone el puerto `3000` (default documentado; el real lo define
   `PORT` en runtime) y define un `HEALTHCHECK` que pega contra
   `/api/health` cada 30s usando `wget` (ya incluido en la imagen
   alpine, no hace falta instalar `curl` aparte).

**`.dockerignore`**: excluye como mínimo `node_modules/`, `.env` /
`.env.test` / `.env.docker`, `.git/`, logs generados
(`logs/*.log*`), uploads generados (contenido de
`uploads/documentos-usuario/` y `uploads/comprobantes-entrega/`),
`coverage/` y archivos temporales — además de `test/` y
`.mocharc.json` (no hacen falta para correr la API en producción,
mantienen la imagen liviana y no exponen la suite de tests).

**Variables de entorno del contenedor**: nunca se hornean en el build.
Se pasan en runtime, con `--env-file` o `-e`:
```
docker build -t shipnow-api .

# Opción A: archivo externo (recomendado)
docker run --env-file .env -p 3000:3000 shipnow-api

# Opción B: variables sueltas
docker run \
  -e PORT=3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/shipnow \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -p 3000:3000 \
  shipnow-api
```
Con el contenedor corriendo, se puede probar como mínimo:
```
curl.exe http://localhost:3000/api/health   # health check
curl.exe http://localhost:3000/api/products # endpoint principal (paginado)
```
(Swagger no responde acá porque `NODE_ENV=production` lo desmonta, ver
arriba — para probarlo dentro del contenedor hay que correrlo con
`NODE_ENV=development` en su lugar.)

**`docker-compose.yml`** (extra, no pedido explícitamente pero incluido
para poder levantar todo el stack —API + MongoDB— con un solo comando,
sin depender de un Mongo instalado a mano en el host):
```
cp .env.docker.example .env.docker
docker compose up --build
```
Levanta la API en `http://localhost:3000` y Mongo en el puerto `27017`
del host (por si se lo quiere inspeccionar con Compass/`mongosh` desde
afuera del contenedor). El servicio `api` espera a que el `healthcheck`
de `mongo` esté en verde antes de arrancar (`depends_on: condition:
service_healthy`), así nunca intenta conectar contra un Mongo que
todavía está inicializando.

## Endpoints

- `GET    /api/products` — paginado, soporta `?onlyAvailable=`, `?page=`, `?limit=` (Módulo 8).
- `GET    /api/products/:id`
- `POST   /api/products`
- `PUT    /api/products/:id`
- `DELETE /api/products/:id`
- (mismos verbos en `/api/users`, también paginado en su `GET` de listado)

### Orders y Deliveries (Módulo 5)

- `GET    /api/orders` — paginado, soporta `?status=`, `?page=`, `?limit=` (Módulo 8).
- `GET    /api/orders/:id`
- `POST   /api/orders`
- `PATCH  /api/orders/:id/status` — body `{ "status": "CONFIRMED" }`.
- `DELETE /api/orders/:id`
- (mismos endpoints en `/api/deliveries`, también paginado en su `GET` de listado)

Ver el detalle completo (parámetros, bodies, respuestas y errores) en `/api/docs`
(no disponible en producción, ver Módulo 8 más abajo).

### Health check (Módulo 8)

- `GET /api/health` — estado de la API. Disponible en todos los entornos,
  incluida producción. Ver detalle en la sección "Performance, preparación
  para producción y Docker" más abajo.

### Mocking (Módulo 2)

> **No disponibles en producción** (`NODE_ENV=production`): ver
> "Criterio sobre endpoints internos" en el Módulo 8, más abajo.

- `GET  /api/mocks` — devuelve datos simulados **sin guardarlos** en la base.
  Acepta query params opcionales para definir cuántos registros generar:
  ```
  GET /api/mocks?users=5&orders=5&deliveries=5
  ```
  Devuelve un objeto con `users`, `riders`, `orders` y `deliveries` en memoria,
  con relaciones coherentes entre sí (aunque los `_id` sean simulados, ya que
  nada se persiste).

- `POST /api/mocks/seed` — inserta registros de prueba **reales** en MongoDB.
  Body opcional (si no se manda, usa 5 de cada uno):
  ```json
  { "users": 5, "orders": 5, "deliveries": 5 }
  ```
  Internamente:
  1. Crea usuarios con rol `USER` y un subgrupo con rol `DELIVERY` (repartidores).
  2. Crea pedidos (`Order`) asociados a usuarios reales recién creados, con
     `status` y `priority` tomados de las constantes (`ORDER_STATUS`,
     `ORDER_PRIORITY`), nunca strings sueltos.
  3. Crea entregas (`Delivery`) asociadas a pedidos y repartidores reales,
     con `status` desde `DELIVERY_STATUS`.

  Devuelve un resumen (`summary`) con la cantidad creada de cada entidad y
  los documentos insertados (`data`).

  **Cómo probarlo:**
  ```
  curl.exe -X POST http://localhost:3000/api/mocks/seed -H "Content-Type: application/json" -d '{\"users\":3,\"orders\":3,\"deliveries\":3}'
  ```
  Luego podés confirmar que se guardaron de verdad con:
  ```
  curl.exe http://localhost:3000/api/users
  ```

  Toda la lógica de generación vive en `services/mock.service.js`. El
  controller y las rutas (`controllers/mock.controller.js`,
  `routes/mock.routes.js`) son mínimos, y la persistencia siempre pasa por
  los repositories existentes (`user.repository`, `order.repository`,
  `delivery.repository`) — el módulo de mocking no importa Mongoose en
  ningún momento.

## ¿Por qué separar así entre Service y Repository?

El **Repository** es la única capa que sabe que existe Mongoose. Su
responsabilidad es exclusivamente buscar y persistir datos: aplica
filtros por defecto (por ejemplo, no devolver registros borrados
lógicamente) y proyecciones (por ejemplo, no devolver el password de
un usuario). No decide nada sobre reglas de negocio.

El **Service** es donde vive el "por qué": por ejemplo, calcular el
`status` de un producto en base a su stock, decidir que un usuario
nuevo nunca puede autoasignarse el rol `ADMIN`, o validar permisos
antes de una acción. Si mañana cambiamos MongoDB por otra base de
datos, el Service no debería cambiar una sola línea — solo cambiaría
la implementación del Repository.

Esta separación hace que cada capa se pueda testear y modificar de
forma independiente, y evita que la lógica de negocio quede mezclada
con detalles de infraestructura.
