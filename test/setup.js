// Root hook file (referenciado desde .mocharc.json vía "require"). Se carga
// UNA sola vez, antes de todos los archivos de test, y sus hooks aplican a
// nivel global sin necesidad de repetirlos en cada suite.

process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const env = require('../src/config/env.config');

// Red de seguridad: si por error MONGODB_URI (en modo test) apunta a algo
// que no es una base de testing, cortamos ACÁ antes de tocar un solo dato.
// Evita que un afterEach borre por accidente una base de desarrollo/producción.
if (!/test/i.test(env.MONGODB_URI)) {
  throw new Error(
    '[test/setup.js] MONGODB_URI no parece apuntar a una base de testing ' +
      '(el nombre debe contener "test"). Revisá tu archivo .env.test.'
  );
}

// Se exportan como "root hooks" (mochaHooks) en vez de llamar a
// before/after/afterEach directamente: este archivo se carga vía
// "require" en .mocharc.json, ANTES de que Mocha registre la interfaz
// BDD global, así que describe/it/before todavía no existen en ese
// momento. mochaHooks es la forma soportada de definir hooks globales
// desde un archivo cargado con --require.
exports.mochaHooks = {
  async beforeAll() {
    this.timeout(20000);
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  },

  // Limpieza de datos: se corre DESPUÉS de cada test (no antes/después de
  // cada archivo), para que ningún test dependa de datos dejados por otro
  // ni del orden en el que Mocha decida correrlos.
  async afterEach() {
    if (mongoose.connection.readyState !== 1) return;

    const collections = mongoose.connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({}))
    );
  },

  async afterAll() {
    await mongoose.connection.close();
  },
};
