const mongoose = require('mongoose');
const env = require('./config/env.config');
const logger = require('./config/logger.config');
const app = require('./app');

// Red de seguridad para errores que escapan de Express (no ocurrieron
// dentro de un request, o alguien tiró una excepción fuera de una ruta):
// sin esto, Node los imprime crudo por consola y Winston nunca se entera.
// Son fallas críticas de un proceso en estado inconsistente, así que se
// loguean como fatal y se corta el proceso (dejar el proceso vivo después
// de un uncaughtException es la recomendación oficial de Node: puede
// quedar en un estado corrupto).
process.on('uncaughtException', (err) => {
  logger.fatal(`Excepción no capturada: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.fatal(`Promise rechazada sin manejar: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

// Si la conexión se cae DESPUÉS del arranque exitoso (no en el connect()
// inicial), Mongoose la reporta acá. No es un fallo de arranque, así que
// se registra como error (no fatal): el proceso sigue vivo.
mongoose.connection.on('error', (err) => {
  logger.error(`Error de conexión a MongoDB: ${err.message}`, { stack: err.stack });
});

async function start() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Conexión a MongoDB establecida');

    app.listen(env.PORT, () => {
      logger.info(`Servidor ShipNow escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    // No poder arrancar (Mongo caído, URI mal formada, etc.) es una falla
    // crítica de configuración/infraestructura: se registra como fatal.
    logger.fatal(`No se pudo iniciar el servidor: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

start();
