/**
 * Solo documentación (JSDoc). La lógica real vive en routes/delivery.routes.js,
 * controllers/delivery.controller.js y services/delivery.service.js.
 */

/**
 * @openapi
 * /deliveries:
 *   get:
 *     tags: [Deliveries]
 *     summary: Listar entregas
 *     description: >
 *       Devuelve las entregas no eliminadas, con el pedido y el repartidor
 *       populados, paginadas (Módulo 8: nunca se devuelve la colección
 *       completa sin límite).
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, IN_PROGRESS, COMPLETED, FAILED]
 *         description: Filtra las entregas por estado exacto.
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Página de entregas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     tags: [Deliveries]
 *     summary: Crear una entrega
 *     description: Si no se envía `status`, la entrega arranca en ASSIGNED.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryInput'
 *     responses:
 *       201:
 *         description: Entrega creada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Faltan campos obligatorios (order o rider), o status inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /deliveries/{id}:
 *   get:
 *     tags: [Deliveries]
 *     summary: Obtener una entrega por ID
 *     parameters:
 *       - $ref: '#/components/parameters/DeliveryId'
 *     responses:
 *       200:
 *         description: Entrega encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   delete:
 *     tags: [Deliveries]
 *     summary: Eliminar una entrega (borrado lógico)
 *     parameters:
 *       - $ref: '#/components/parameters/DeliveryId'
 *     responses:
 *       204:
 *         description: Entrega eliminada, sin contenido en la respuesta.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /deliveries/{id}/status:
 *   patch:
 *     tags: [Deliveries]
 *     summary: Cambiar el estado de una entrega
 *     description: >
 *       El `status` enviado debe pertenecer al enum DELIVERY_STATUS
 *       (ASSIGNED, IN_PROGRESS, COMPLETED, FAILED); cualquier otro valor
 *       devuelve 400 INVALID_STATUS.
 *     parameters:
 *       - $ref: '#/components/parameters/DeliveryId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryStatusInput'
 *     responses:
 *       200:
 *         description: Entrega con el estado actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       400:
 *         $ref: '#/components/responses/InvalidStatus'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /deliveries/{id}/proof:
 *   post:
 *     tags: [Deliveries]
 *     summary: Subir un comprobante de entrega (Módulo 7)
 *     description: >
 *       Recibe un archivo (foto o PDF del comprobante) y lo asocia a la
 *       entrega indicada. El archivo se guarda en
 *       `uploads/comprobantes-entrega/`; en la base solo se registran sus
 *       metadatos (ver `FileMetadata`). Verifica primero que la entrega
 *       exista, y valida el archivo (tipo, tamaño). Una entrega puede
 *       tener más de un comprobante (ej: reintento tras una entrega
 *       fallida), por eso `proofs` es un array.
 *     parameters:
 *       - $ref: '#/components/parameters/DeliveryId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo del comprobante (PDF, JPG o PNG; máximo 5 MB).
 *     responses:
 *       201:
 *         description: Comprobante cargado y asociado a la entrega.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Falta el archivo, el tipo no es permitido, o supera el tamaño máximo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * components:
 *   parameters:
 *     DeliveryId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ObjectId de la entrega.
 *       example: 64b1f0c2e1a2b3c4d5e6f7c1
 */
