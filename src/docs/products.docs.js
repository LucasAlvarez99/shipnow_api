/**
 * Solo documentación (JSDoc). La lógica real vive en routes/product.routes.js,
 * controllers/product.controller.js y services/product.service.js.
 */

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Listar productos
 *     description: >
 *       Devuelve los productos no eliminados, paginados (Módulo 8: nunca
 *       se devuelve la colección completa sin límite). Se puede filtrar
 *       solo los disponibles.
 *     parameters:
 *       - in: query
 *         name: onlyAvailable
 *         schema:
 *           type: boolean
 *         description: Si es `true`, devuelve solo productos con status AVAILABLE.
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Página de productos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     tags: [Products]
 *     summary: Crear un producto
 *     description: >
 *       Regla de negocio: si el stock enviado es 0, el producto se crea con
 *       status OUT_OF_STOCK automáticamente (aunque se envíe otro status).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Auriculares inalámbricos
 *               price:
 *                 type: number
 *                 example: 15999.9
 *               stock:
 *                 type: integer
 *                 example: 12
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *     responses:
 *       201:
 *         description: Producto creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Faltan campos obligatorios o el status enviado no es válido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Obtener un producto por ID
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       200:
 *         description: Producto encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   put:
 *     tags: [Products]
 *     summary: Actualizar un producto
 *     description: >
 *       Regla de negocio: si se actualiza el stock a 0, el status pasa a
 *       OUT_OF_STOCK automáticamente; si es mayor a 0, pasa a AVAILABLE.
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *     responses:
 *       200:
 *         description: Producto actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/InvalidStatus'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   delete:
 *     tags: [Products]
 *     summary: Eliminar un producto (borrado lógico)
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       204:
 *         description: Producto eliminado, sin contenido en la respuesta.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * components:
 *   parameters:
 *     ProductId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ObjectId del producto.
 *       example: 64b1f0c2e1a2b3c4d5e6f7a9
 */
