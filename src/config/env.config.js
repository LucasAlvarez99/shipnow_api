const path = require('path');
const dotenv = require('dotenv');

// Entorno de testing separado del de desarrollo: cuando NODE_ENV=test
// (lo setea el script "test" de package.json) se carga .env.test en vez
// de .env, para que los tests usen su propia MONGODB_URI (una base
// distinta a la de desarrollo) sin arriesgar tocar datos reales.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });

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
