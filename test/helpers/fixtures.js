// Helpers para crear datos de prueba controlados y repetibles directamente
// contra la base de testing (sin pasar por la API), pensados para dejar
// precondiciones listas antes de ejercitar un endpoint (ej: un usuario
// válido antes de crear un pedido). Los modelos de Mongoose se usan acá
// nomás, en los tests; el resto de la app siempre pasa por el Repository.

const mongoose = require('mongoose');
const User = require('../../src/models/user.model');
const Product = require('../../src/models/product.model');
const Order = require('../../src/models/order.model');
const Delivery = require('../../src/models/delivery.model');
const { USER_ROLES, DELIVERY_STATUS } = require('../../src/constants');

let sequence = 0;
function nextSequence() {
  sequence += 1;
  return sequence;
}

async function createUser(overrides = {}) {
  const n = nextSequence();
  return User.create({
    name: `Usuario Test ${n}`,
    email: `usuario.test.${n}@shipnow.test`,
    password: 'test1234',
    role: USER_ROLES.USER,
    ...overrides,
  });
}

async function createProduct(overrides = {}) {
  const n = nextSequence();
  return Product.create({
    name: `Producto Test ${n}`,
    price: 1000,
    stock: 10,
    ...overrides,
  });
}

async function createOrder(overrides = {}) {
  const user = overrides.user || (await createUser())._id;
  const product = overrides.product || (await createProduct())._id;

  return Order.create({
    user,
    items: [{ product, quantity: 2 }],
    totalAmount: 2000,
    ...overrides,
  });
}

async function createDelivery(overrides = {}) {
  const order = overrides.order || (await createOrder())._id;
  const rider = overrides.rider || (await createUser({ role: USER_ROLES.DELIVERY }))._id;

  return Delivery.create({
    order,
    rider,
    status: DELIVERY_STATUS.ASSIGNED,
    ...overrides,
  });
}

// ObjectId con formato válido pero que no existe en la base: sirve para
// probar los casos de "recurso no encontrado" sin depender de un ID real.
function fakeObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

module.exports = {
  createUser,
  createProduct,
  createOrder,
  createDelivery,
  fakeObjectId,
};
