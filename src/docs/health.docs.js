/**
 * Solo documentación (JSDoc). La lógica real vive en
 * routes/health.routes.js y controllers/health.controller.js.
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Estado de la API
 *     description: >
 *       Health check simple (Módulo 8), pensado para orquestadores y
 *       monitoreo (ej. HEALTHCHECK de Docker). Disponible en todos los
 *       entornos, incluida producción. No expone información sensible
 *       (nada de URIs de conexión, stack traces, ni detalles de
 *       infraestructura): solo confirma si el proceso está vivo y si
 *       puede hablar con MongoDB.
 *     responses:
 *       200:
 *         description: La API está operativa y conectada a MongoDB.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: El proceso está vivo pero MongoDB no está conectado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [ok, degraded]
 *           example: ok
 *         environment:
 *           type: string
 *           example: production
 *         uptime:
 *           type: number
 *           description: Segundos desde que arrancó el proceso.
 *           example: 12345.67
 *         timestamp:
 *           type: string
 *           format: date-time
 */
