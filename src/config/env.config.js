const path = require('path');
const dotenv = require('dotenv');

// Entorno de testing separado del de desarrollo: cuando NODE_ENV=test
// (lo setea el script "test" de package.json) se carga .env.test en vez
// de .env, para que los tests usen su propia MONGODB_URI (una base
// distinta a la de desarrollo) sin arriesgar tocar datos reales.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });

/**
 * Lista de variables de entorno obligatorias (Módulo 1, ampliada en el
 * Módulo 8 con LOG_LEVEL). Si falta alguna, la app no debe arrancar.
 *
 * Nota sobre las variables que la consigna pide "como mínimo" y que NO
 * están acá:
 * - Secreto de JWT: no aplica. La API no implementa autenticación (no
 *   hay login ni tokens en ningún endpoint), así que no existe ningún
 *   secreto que gestionar. Si en el futuro se agrega auth, el secreto
 *   se sumaría acá como obligatorio, nunca hardcodeado en el código.
 * - URLs de servicios externos: no aplica. ShipNow no integra hoy con
 *   ningún servicio de terceros (no hay pasarela de pago, gateway de
 *   notificaciones, etc.). El día que se agregue una integración así,
 *   su URL se sumaría acá como variable de entorno, nunca hardcodeada.
 */
const REQUIRED_VARS = ['PORT', 'MONGODB_URI', 'NODE_ENV', 'LOG_LEVEL'];

// Único lugar del proyecto que sabe qué valores son válidos para estas
// dos variables (coincide con los niveles reales de logger.config.js).
const VALID_NODE_ENVS = ['development', 'test', 'production'];
const VALID_LOG_LEVELS = ['fatal', 'error', 'warning', 'info', 'http', 'debug'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[env.config] Faltan variables de entorno obligatorias: ${missing.join(
        ', '
      )}. Revisá tu archivo .env (usá .env.example como referencia).`
    );
  }

  if (!VALID_NODE_ENVS.includes(process.env.NODE_ENV)) {
    throw new Error(
      `[env.config] NODE_ENV="${process.env.NODE_ENV}" no es válido. ` +
        `Valores permitidos: ${VALID_NODE_ENVS.join(', ')}.`
    );
  }

  if (!VALID_LOG_LEVELS.includes(process.env.LOG_LEVEL)) {
    throw new Error(
      `[env.config] LOG_LEVEL="${process.env.LOG_LEVEL}" no es válido. ` +
        `Valores permitidos: ${VALID_LOG_LEVELS.join(', ')}.`
    );
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`[env.config] PORT debe ser un entero positivo (recibido: "${process.env.PORT}").`);
  }
}

validateEnv();

// Este es el ÚNICO lugar del proyecto donde se debería leer process.env directamente.
const env = Object.freeze({
  PORT: Number(process.env.PORT),
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  // Criterio de endpoints internos (Módulo 8): mocks, /logger/test y
  // Swagger UI se desmontan por completo en producción (ver routes/index.js
  // y app.js). Se deriva de NODE_ENV en vez de tener su propia variable
  // porque no es una decisión de configuración del deploy, sino una regla
  // fija del proyecto: "en producción, estas herramientas de diagnóstico
  // y de generación de datos de prueba no existen".
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
});

module.exports = env;
