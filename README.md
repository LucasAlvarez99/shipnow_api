# ShipNow API — Estructura profesional (Módulo 1)

Refactorización de la API base de ShipNow a arquitectura por capas
(Controller → Service → Repository) más una capa de configuración
de entorno validada.

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
