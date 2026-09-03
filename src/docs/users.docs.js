/**
 * Solo documentación (JSDoc). La lógica real vive en routes/user.routes.js,
 * controllers/user.controller.js y services/user.service.js.
 */

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Listar usuarios
 *     description: >
 *       Devuelve los usuarios no eliminados (sin el campo password),
 *       paginados (Módulo 8: nunca se devuelve la colección completa sin
 *       límite).
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Página de usuarios.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     tags: [Users]
 *     summary: Crear un usuario
 *     description: >
 *       Si no se envía `role`, se asigna USER por defecto (nunca ADMIN por
 *       default, aunque se lo pidan explícitamente sin ser ADMIN válido).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Usuario creado (sin password en la respuesta).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Faltan campos obligatorios (name, email o password).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: >
 *           Error interno (incluye el caso de email duplicado, que Mongo
 *           rechaza por el índice `unique` y hoy cae como error genérico
 *           500, no como un 409 específico).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtener un usuario por ID
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     responses:
 *       200:
 *         description: Usuario encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   put:
 *     tags: [Users]
 *     summary: Actualizar un usuario
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER, DELIVERY]
 *     responses:
 *       200:
 *         description: Usuario actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar un usuario (borrado lógico)
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     responses:
 *       204:
 *         description: Usuario eliminado, sin contenido en la respuesta.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /users/{id}/documents:
 *   post:
 *     tags: [Users]
 *     summary: Subir un documento de usuario (Módulo 7)
 *     description: >
 *       Recibe un archivo (DNI, licencia u otro documento) y lo asocia al
 *       usuario indicado. El archivo se guarda en
 *       `uploads/documentos-usuario/`; en la base solo se registran sus
 *       metadatos (ver `FileMetadata`). Verifica primero que el usuario
 *       exista, y valida el archivo (tipo, tamaño) y el `documentType`
 *       enviado.
 *     parameters:
 *       - $ref: '#/components/parameters/UserId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, documentType]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (PDF, JPG o PNG; máximo 5 MB).
 *               documentType:
 *                 type: string
 *                 enum: [DNI, LICENCIA, OTRO]
 *                 description: Tipo de documento que representa el archivo.
 *     responses:
 *       201:
 *         description: Documento cargado y asociado al usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: >
 *           Falta el archivo, el tipo de archivo no es permitido, supera
 *           el tamaño máximo, o `documentType` no es válido.
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
 *     UserId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: ObjectId del usuario.
 *       example: 64b1f0c2e1a2b3c4d5e6f7a8
 */
