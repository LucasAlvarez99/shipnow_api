const mongoose = require('mongoose');
const env = require('./config/env.config');
const app = require('./app');

async function start() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    app.listen(env.PORT, () => {
      console.log(`Servidor corriendo en el puerto ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
