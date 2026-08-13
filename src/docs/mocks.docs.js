/**
 * Solo documentación (JSDoc). La lógica real vive en routes/mock.routes.js,
 * controllers/mock.controller.js y services/mock.service.js.
 */

/**
 * @openapi
 * /mocks:
 *   get:
 *     tags: [Mocks]
 *     summary: Previsualizar datos de prueba (sin guardarlos)
 *     description: >
 *       Genera usuarios, repartidores, pedidos y entregas simulados
 *       EN MEMORIA, con relaciones consistentes entre sí (ObjectIds
 *       válidos en formato, pero no persistidos). No modifica la base
 *       de datos.
 *     parameters:
 *       - in: query
 *         name: users
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Cantidad de usuarios a simular (entero entre 1 y 50).
 *       - in: query
 *         name: orders
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Cantidad de pedidos a simular (entero entre 1 y 50).
 *       - in: query
 *         name: deliveries
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Cantidad de entregas a simular (entero entre 1 y 50).
 *     responses:
 *       200:
 *         description: Datos simulados en memoria (users, riders, orders, deliveries).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 riders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 deliveries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: >
 *           Alguna cantidad (`users`, `orders` o `deliveries`) no es un
 *           entero entre 1 y 50 (faltante, no numérica, negativa, cero,
 *           decimal o mayor a 50).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 code: INVALID_MOCK_QUANTITY
 *                 message: La cantidad de datos mock solicitada no es válida
 *                 details:
 *                   field: users
 *                   received: -3
 *                   rule: Debe ser un entero entre 1 y 50
 *
 * /mocks/seed:
 *   post:
 *     tags: [Mocks]
 *     summary: Insertar datos de prueba reales en MongoDB
 *     description: >
 *       A diferencia de GET /mocks, esta operación SÍ persiste los datos:
 *       inserta usuarios, repartidores, pedidos y entregas reales,
 *       respetando las relaciones (pedido → usuario existente, entrega →
 *       pedido y repartidor existentes).
 *     requestBody:
 *       required: false
 *       description: Si no se envía body, se usan 5 usuarios, 5 pedidos y 5 entregas por defecto.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               users:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 5
 *               orders:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 5
 *               deliveries:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 5
 *     responses:
 *       201:
 *         description: Resumen de lo insertado, más los documentos creados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     usersCreated:
 *                       type: integer
 *                     ridersCreated:
 *                       type: integer
 *                     ordersCreated:
 *                       type: integer
 *                     deliveriesCreated:
 *                       type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     riders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     deliveries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Alguna cantidad enviada no es un entero entre 1 y 50.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: >
 *           Falló la inserción en MongoDB (timeout, conexión caída, etc.).
 *           Se traduce siempre a DATABASE_ERROR, nunca se expone el error
 *           real de Mongoose al cliente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error:
 *                 code: DATABASE_ERROR
 *                 message: Ocurrió un error al acceder a la base de datos
 */
