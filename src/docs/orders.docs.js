/**
 * Solo documentación (JSDoc). La lógica real vive en routes/order.routes.js,
 * controllers/order.controller.js y services/order.service.js.
 */

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Listar pedidos
 *     description: >
 *       Devuelve los pedidos no eliminados, con el usuario populado,
 *       paginados (Módulo 8: nunca se devuelve la colección completa sin
 *       límite).
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED]
 *         description: Filtra los pedidos por estado exacto.
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Página de pedidos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     tags: [Orders]
 *     summary: Crear un pedido
 *     description: Si no se envía `status`, arranca en PENDING; si no se envía `priority`, arranca en MEDIUM.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Pedido creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Faltan campos obligatorios (user, items o totalAmount), o status/priority inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Obtener un pedido por ID
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     responses:
 *       200:
 *         description: Pedido encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   delete:
 *     tags: [Orders]
 *     summary: Eliminar un pedido (borrado lógico)
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     responses:
 *       204:
 *         description: Pedido eliminado, sin contenido en la respuesta.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Cambiar el estado de un pedido
 *     description: >
 *       El `status` enviado debe pertenecer al enum ORDER_STATUS
 *       (PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED); cualquier
 *       otro valor devuelve 400 INVALID_STATUS.
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatusInput'
 *     responses:
 *       200:
 *         description: Pedido con el estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/InvalidStatus'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * components:
 *   parameters:
 *     OrderId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ObjectId del pedido.
 *       example: 64b1f0c2e1a2b3c4d5e6f7b1
 */
