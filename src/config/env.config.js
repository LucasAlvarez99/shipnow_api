const dotenv = require('dotenv');
dotenv.config();

/**
 * Lista de variables de entorno obligatorias.
 * Si falta alguna, la app no debe arrancar.
 */
const REQUIRED_VARS = ['PORT', 'MONGODB_URI', 'NODE_ENV'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[env.config] Faltan variables de entorno obligatorias: ${missing.join(
        ', '
      )}. Revisá tu archivo .env (usá .env.example como referencia).`
    );
  }
}

validateEnv();

// Este es el ÚNICO lugar del proyecto donde se debería leer process.env directamente.
const env = Object.freeze({
  PORT: Number(process.env.PORT),
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV,
});

module.exports = env;
