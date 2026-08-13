/**
 * Este archivo NO tiene lógica: solo define, vía JSDoc, los schemas
 * reutilizables que después referencian los demás archivos de docs con
 * $ref: '#/components/schemas/<Nombre>'. swagger-jsdoc lo escanea igual
 * que cualquier otro archivo del glob configurado en swagger.config.js.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64b1f0c2e1a2b3c4d5e6f7a8
 *         name:
 *           type: string
 *           example: Lucas Álvarez
 *         email:
 *           type: string
 *           format: email
 *           example: lucas@shipnow.com
 *         role:
 *           type: string
 *           enum: [ADMIN, USER, DELIVERY]
 *           example: USER
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       description: >
 *         El campo `password` nunca se devuelve en ninguna respuesta,
 *         ni siquiera al crear el usuario.
 *
 *     UserInput:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *           example: Lucas Álvarez
 *         email:
 *           type: string
 *           format: email
 *           example: lucas@shipnow.com
 *         password:
 *           type: string
 *           format: password
 *           example: superSecreta123
 *         role:
 *           type: string
 *           enum: [ADMIN, USER, DELIVERY]
 *           description: Si no se envía, se asigna USER por defecto (nunca ADMIN por default).
 *
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64b1f0c2e1a2b3c4d5e6f7a9
 *         name:
 *           type: string
 *           example: Auriculares inalámbricos
 *         price:
 *           type: number
 *           example: 15999.9
 *         stock:
 *           type: integer
 *           example: 12
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *           example: AVAILABLE
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     OrderItem:
 *       type: object
 *       required: [quantity]
 *       properties:
 *         product:
 *           type: string
 *           description: ObjectId del producto (puede quedar sin definir en pedidos de prueba).
 *           example: 64b1f0c2e1a2b3c4d5e6f7a9
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64b1f0c2e1a2b3c4d5e6f7b1
 *         user:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *           description: ObjectId del usuario dueño del pedido (populado con name/email/role al leerlo).
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           example: 15999.9
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED]
 *           example: PENDING
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           example: MEDIUM
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     OrderInput:
 *       type: object
 *       required: [user, items, totalAmount]
 *       properties:
 *         user:
 *           type: string
 *           description: ObjectId de un usuario ya existente.
 *           example: 64b1f0c2e1a2b3c4d5e6f7a8
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           example: 15999.9
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED]
 *           description: Opcional. Si no se envía, el pedido arranca en PENDING.
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *           description: Opcional. Si no se envía, se asigna MEDIUM.
 *
 *     OrderStatusInput:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_TRANSIT, DELIVERED, CANCELLED]
 *           example: CONFIRMED
 *
 *     Delivery:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64b1f0c2e1a2b3c4d5e6f7c1
 *         order:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Order'
 *           description: ObjectId del pedido asociado (populado al leerlo).
 *         rider:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/User'
 *           description: ObjectId de un usuario con rol DELIVERY (populado al leerlo).
 *         status:
 *           type: string
 *           enum: [ASSIGNED, IN_PROGRESS, COMPLETED, FAILED]
 *           example: ASSIGNED
 *         estimatedDeliveryAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     DeliveryInput:
 *       type: object
 *       required: [order, rider]
 *       properties:
 *         order:
 *           type: string
 *           description: ObjectId de un pedido ya existente.
 *           example: 64b1f0c2e1a2b3c4d5e6f7b1
 *         rider:
 *           type: string
 *           description: ObjectId de un usuario con rol DELIVERY.
 *           example: 64b1f0c2e1a2b3c4d5e6f7aa
 *         status:
 *           type: string
 *           enum: [ASSIGNED, IN_PROGRESS, COMPLETED, FAILED]
 *           description: Opcional. Si no se envía, arranca en ASSIGNED.
 *         estimatedDeliveryAt:
 *           type: string
 *           format: date-time
 *
 *     DeliveryStatusInput:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [ASSIGNED, IN_PROGRESS, COMPLETED, FAILED]
 *           example: IN_PROGRESS
 *
 *     SuccessResponse:
 *       type: object
 *       description: Forma genérica de una respuesta 2xx simple (ej. resultado de mocks).
 *       properties:
 *         message:
 *           type: string
 *           example: Operación realizada correctamente
 *
 *     ErrorResponse:
 *       type: object
 *       description: >
 *         Forma ÚNICA de toda respuesta de error de la API (la arma
 *         siempre el middleware global de errores, nunca un controller).
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: USER_NOT_FOUND
 *             message:
 *               type: string
 *               example: Usuario no encontrado
 *             details:
 *               type: object
 *               nullable: true
 *               description: Información adicional según el tipo de error (opcional).
 *
 *   responses:
 *     NotFound:
 *       description: El recurso solicitado no existe.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     ValidationError:
 *       description: Los datos enviados no son válidos (campos faltantes o mal formados).
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     InvalidStatus:
 *       description: El estado enviado no pertenece al enum permitido para esta entidad.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     InternalError:
 *       description: Error inesperado del servidor.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */
