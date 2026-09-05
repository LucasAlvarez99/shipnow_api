/**
 * Solo documentación (JSDoc). La lógica real vive en routes/logger.routes.js
 * y controllers/logger.controller.js.
 */

/**
 * @openapi
 * /logger/test:
 *   get:
 *     tags: [Logger]
 *     summary: Probar los 6 niveles del logger
 *     description: >
 *       **Herramienta interna de diagnóstico, NO una funcionalidad de
 *       negocio.** Dispara un log de cada nivel definido
 *       (debug, http, info, warning, error, fatal) para poder verificar
 *       rápidamente que Winston está bien configurado: la consola solo
 *       muestra algo cuando `NODE_ENV=development` (hasta `LOG_LEVEL`);
 *       en test/producción queda silenciosa. `logs/error.log` guarda
 *       solo fatal/error; `logs/combined.log` guarda toda la actividad
 *       hasta el nivel definido en `LOG_LEVEL`.
 *     responses:
 *       200:
 *         description: Se generaron los logs de prueba correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: >-
 *                     Se generaron logs de prueba en los 6 niveles: debug, http, info, warning, error, fatal
 *                 revisar:
 *                   type: object
 *                   properties:
 *                     consola:
 *                       type: string
 *                     archivo:
 *                       type: string
 */
