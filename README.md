# ShipNow API — Estructura profesional (Módulo 1) + Mocking (Módulo 2)

Refactorización de la API base de ShipNow a arquitectura por capas
(Controller → Service → Repository) más una capa de configuración
de entorno validada, y un módulo de mocking para generar datos de
prueba (usuarios, repartidores, pedidos y entregas) sin cargarlos a mano.

## Estructura

```
src/
  config/         -> validación y export de variables de entorno (env.config.js)
  constants/      -> valores inmutables del dominio (roles, estados)
  models/         -> esquemas de Mongoose (sin lógica de negocio)
  repositories/   -> único lugar que conoce Mongoose/MongoDB
  services/       -> lógica de negocio, llama a los repositories
  controllers/    -> gestiona req/res, llama a los services
  routes/         -> conecta cada path con su método del controller
  app.js          -> configuración de Express
  server.js       -> punto de entrada, conecta a Mongo y levanta el server
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

## Endpoints

- `GET    /api/products`
- `GET    /api/products/:id`
- `POST   /api/products`
- `PUT    /api/products/:id`
- `DELETE /api/products/:id`
- (mismos verbos en `/api/users`)

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
