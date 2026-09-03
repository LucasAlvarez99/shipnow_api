const mongoose = require('mongoose');
const env = require('../config/env.config');

/**
 * Health check simple (Módulo 8), pensado para orquestadores/monitoreo
 * (ej: HEALTHCHECK de Docker, un balanceador, un uptime checker) y no
 * para debugging humano: por eso NO expone información sensible (nada
 * de MONGODB_URI, stack traces, ni detalles de infraestructura). Solo
 * confirma si el proceso está vivo y si puede hablar con MongoDB.
 *
 * A propósito no vive detrás de Service/Repository: no hay lógica de
 * negocio ni acceso a datos de dominio, solo mira el estado de la
 * conexión que ya mantiene Mongoose (mongoose.connection.readyState).
 */
class HealthController {
  check(req, res) {
    // readyState: 0 desconectado, 1 conectado, 2 conectando, 3 desconectando.
    const dbConnected = mongoose.connection.readyState === 1;

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? 'ok' : 'degraded',
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new HealthController();
