const mongoose = require('mongoose');
const env = require('./config/env.config');
const logger = require('./config/logger.config');
const app = require('./app');

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
