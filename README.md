# ShipNow API — Estructura profesional (M1) + Mocking (M2) + Errores (M3) + Logging (M4) + Swagger (M5) + Testing (M6)

Refactorización de la API base de ShipNow a arquitectura por capas
(Controller → Service → Repository) más una capa de configuración
de entorno validada, un módulo de mocking para generar datos de
prueba (usuarios, repartidores, pedidos y entregas), una capa
centralizada de manejo de errores, un sistema de logging
profesional con Winston conectado a esa capa de errores,
documentación interactiva de la API con Swagger/OpenAPI, y una
suite de tests funcionales automatizados con Mocha, Chai y
Supertest.

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
  docs/             -> SOLO documentación (bloques JSDoc @openapi), sin lógica:
    schemas.docs.js    -> schemas reutilizables (User, Product, Order, Delivery, ErrorResponse, etc.)
    products.docs.js, users.docs.js, orders.docs.js,
    deliveries.docs.js, mocks.docs.js, logger.docs.js -> paths por módulo (uno por tag)
  constants/      -> valores inmutables del dominio (roles, estados, prioridades)
  errors/         -> AppError base, diccionario de errores y errores de dominio
  middlewares/
    error.middleware.js      -> middleware global de manejo de errores (logueado con Winston)
    httpLogger.middleware.js -> loguea cada request (nivel http)
  models/         -> esquemas de Mongoose (sin lógica de negocio)
  repositories/   -> único lugar que conoce Mongoose/MongoDB
  services/       -> lógica de negocio, valida y lanza errores de dominio
  controllers/    -> gestiona req/res, llama al service y delega errores con next(err)
  routes/         -> conecta cada path con su método del controller (SIN nada de Swagger acá)
  app.js          -> configuración de Express + middlewares globales + monta Swagger UI
  server.js       -> punto de entrada, conecta a Mongo y levanta el server
logs/             -> archivos de logs generados por Winston (no se versionan, ver .gitignore)
test/             -> suite de tests funcionales (Mocha + Chai + Supertest, Módulo 6)
  setup.js            -> root hooks: conecta/limpia/desconecta la base de testing
  helpers/fixtures.js -> datos de prueba controlados y repetibles (usuarios, pedidos, etc.)
  *.test.js           -> un archivo de tests por módulo de endpoints
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
   Si falta `MONGODB_URI` (o cualquier otra variable obligatoria), la app
   tira un error descriptivo al arrancar y no levanta el servidor.

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
| `test/users.test.js` | `GET /api/users`, `GET /api/users/:id` | Listado vacío y con usuarios (sin exponer `password`) | `USER_NOT_FOUND` (404) |
| `test/orders.test.js` | `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, `PATCH /api/orders/:id/status` | Listar, ver por ID, crear con datos válidos, actualizar a un estado válido | `VALIDATION_ERROR` (400, datos incompletos), `ORDER_NOT_FOUND` (404), `INVALID_STATUS` (400) |
| `test/mocks.test.js` | `GET /api/mocks`, `POST /api/mocks/seed` | Preview en memoria (no persiste nada) y seed real en Mongo | `INVALID_MOCK_QUANTITY` (400, cantidad negativa o no numérica) |
| `test/logger.test.js` | `GET /api/logger/test` | Dispara los 6 niveles de log y devuelve el resumen esperado | — |
| `test/docs.test.js` | `GET /api/docs` | Sirve la interfaz de Swagger UI (`text/html`) | — |
| `test/notFound.test.js` | Cualquier ruta no manejada | — | `ROUTE_NOT_FOUND` (404), coherente con lo documentado en Swagger |

Cada test valida el status HTTP **y** la estructura del body (incluyendo,
en los errores, el `code` definido en `errors/error.dictionary.js` y,
cuando corresponde, el campo `details`), nunca solo que el endpoint
"responda" o "falle".

## Endpoints

- `GET    /api/products`
- `GET    /api/products/:id`
- `POST   /api/products`
- `PUT    /api/products/:id`
- `DELETE /api/products/:id`
- (mismos verbos en `/api/users`)

### Orders y Deliveries (Módulo 5)

- `GET    /api/orders` — soporta `?status=` para filtrar.
- `GET    /api/orders/:id`
- `POST   /api/orders`
- `PATCH  /api/orders/:id/status` — body `{ "status": "CONFIRMED" }`.
- `DELETE /api/orders/:id`
- (mismos endpoints en `/api/deliveries`)

Ver el detalle completo (parámetros, bodies, respuestas y errores) en `/api/docs`.

### Mocking (Módulo 2)

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
