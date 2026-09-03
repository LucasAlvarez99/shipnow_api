const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const env = require('./env.config');

/**
 * Configuración de Swagger/OpenAPI. Este archivo es el ÚNICO lugar del
 * proyecto que arma la especificación de la documentación: la info
 * general, los servers, los tags y (vía `apis`) dónde buscar los bloques
 * JSDoc con los paths y schemas reales.
 *
 * Ningún archivo de `routes/` ni de `controllers/` conoce Swagger: toda
 * la documentación vive en `src/docs/*.docs.js`, archivos que SOLO
 * contienen comentarios JSDoc (no lógica de rutas).
 */
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'ShipNow API',
    version: '1.0.0',
    description:
      'API de ShipNow: gestión de productos, usuarios, pedidos y entregas, ' +
      'con generación de datos de prueba (mocks) y un endpoint interno para ' +
      'validar el sistema de logging. Arquitectura por capas ' +
      '(Controller → Service → Repository), manejo centralizado de errores ' +
      '(Módulo 3) y logging con Winston (Módulo 4).',
    contact: {
      name: 'Lucas Alvarez',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api`,
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Products', description: 'Catálogo de productos' },
    { name: 'Users', description: 'Usuarios de la plataforma (clientes y repartidores)' },
    { name: 'Orders', description: 'Pedidos realizados por los usuarios' },
    { name: 'Deliveries', description: 'Entregas asociadas a un pedido y un repartidor' },
    { name: 'Mocks', description: 'Generación de datos de prueba (usuarios, pedidos, entregas)' },
    {
      name: 'Logger',
      description:
        'Endpoint interno de diagnóstico para validar el logger con Winston. ' +
        'No es una funcionalidad de negocio.',
    },
    {
      name: 'Health',
      description:
        'Health check para orquestadores/monitoreo (Módulo 8). Disponible en todos los entornos.',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Escanea SOLO archivos de documentación (JSDoc puro), nunca los routes/controllers reales.
  apis: [path.join(__dirname, '..', 'docs', '*.docs.js')],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Monta Swagger UI sobre la app de Express recibida. Se llama una sola
 * vez desde app.js; ningún otro archivo necesita saber cómo se arma la
 * documentación.
 */
function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { setupSwagger, swaggerSpec };
