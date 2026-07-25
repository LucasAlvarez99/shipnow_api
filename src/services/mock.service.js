const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const orderRepository = require('../repositories/order.repository');
const deliveryRepository = require('../repositories/delivery.repository');
const { USER_ROLES, ORDER_STATUS, ORDER_PRIORITY, DELIVERY_STATUS } = require('../constants');

// -------- Helpers de generación aleatoria (sin librerías externas) --------

const FIRST_NAMES = ['Lucas', 'Martina', 'Julián', 'Sofía', 'Bruno', 'Camila', 'Nicolás', 'Valentina'];
const LAST_NAMES = ['Álvarez', 'Gómez', 'Fernández', 'Rodríguez', 'Pérez', 'Suárez', 'Díaz', 'Romero'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFullName() {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
}

function randomEmail(name, index) {
  return `${name.toLowerCase().replace(/\s+/g, '.')}${index}@mock.shipnow.com`;
}

// -------- Generadores de entidades (objetos planos, sin guardar en DB) --------

class MockService {
  buildMockUser(index, role = USER_ROLES.USER) {
    const name = randomFullName();
    return {
      name,
      email: randomEmail(name, index),
      password: 'mock1234', // dato de prueba, nunca se expone en las respuestas reales
      role, // siempre viene de USER_ROLES, nunca un string suelto
    };
  }

  buildMockOrder(userId, productId) {
    return {
      user: userId,
      items: [{ product: productId, quantity: randomInt(1, 5) }],
      totalAmount: randomInt(500, 20000),
      status: randomItem(Object.values(ORDER_STATUS)),
      priority: randomItem(Object.values(ORDER_PRIORITY)),
    };
  }

  buildMockDelivery(orderId, riderId) {
    const estimated = new Date();
    estimated.setHours(estimated.getHours() + randomInt(1, 48));
    return {
      order: orderId,
      rider: riderId,
      status: randomItem(Object.values(DELIVERY_STATUS)),
      estimatedDeliveryAt: estimated,
    };
  }

  /**
   * Genera datos simulados EN MEMORIA, sin tocar la base.
   * Usa ObjectIds falsos (válidos en formato) solo para que la estructura
   * de las relaciones se vea igual que en un dato real.
   */
  preview({ users = 5, orders = 5, deliveries = 5 } = {}) {
    const fakeUserIds = Array.from({ length: users }, () => new mongoose.Types.ObjectId());
    const fakeRiderIds = Array.from({ length: Math.max(1, Math.ceil(users / 3)) }, () => new mongoose.Types.ObjectId());
    const fakeProductId = new mongoose.Types.ObjectId();
    const fakeOrderIds = Array.from({ length: orders }, () => new mongoose.Types.ObjectId());

    const mockUsers = fakeUserIds.map((id, i) => ({
      _id: id,
      ...this.buildMockUser(i, USER_ROLES.USER),
    }));

    const mockRiders = fakeRiderIds.map((id, i) => ({
      _id: id,
      ...this.buildMockUser(i, USER_ROLES.DELIVERY),
    }));

    const mockOrders = fakeOrderIds.map((id, i) => ({
      _id: id,
      ...this.buildMockOrder(randomItem(fakeUserIds), fakeProductId),
    }));

    const mockDeliveries = Array.from({ length: deliveries }, () =>
      this.buildMockDelivery(randomItem(fakeOrderIds), randomItem(fakeRiderIds))
    );

    return {
      users: mockUsers,
      riders: mockRiders,
      orders: mockOrders,
      deliveries: mockDeliveries,
    };
  }

  /**
   * Inserta datos de prueba REALES en MongoDB, respetando las relaciones:
   * pedido -> usuario existente, entrega -> pedido y repartidor existentes.
   * Siempre pasa por los repositories, nunca toca Mongoose directamente.
   */
  async seed({ users = 5, orders = 5, deliveries = 5 } = {}) {
    const riderCount = Math.max(1, Math.ceil(users / 3));

    const newUsers = Array.from({ length: users }, (_, i) => this.buildMockUser(i, USER_ROLES.USER));
    const newRiders = Array.from({ length: riderCount }, (_, i) =>
      this.buildMockUser(users + i, USER_ROLES.DELIVERY)
    );

    const insertedUsers = await userRepository.insertMany(newUsers);
    const insertedRiders = await userRepository.insertMany(newRiders);

    // No dependemos de un Product real: si no hay ninguno cargado, el item queda sin product.
    const newOrders = Array.from({ length: orders }, () =>
      this.buildMockOrder(randomItem(insertedUsers)._id, undefined)
    );
    const insertedOrders = await orderRepository.insertMany(newOrders);

    const newDeliveries = Array.from({ length: deliveries }, () =>
      this.buildMockDelivery(randomItem(insertedOrders)._id, randomItem(insertedRiders)._id)
    );
    const insertedDeliveries = await deliveryRepository.insertMany(newDeliveries);

    return {
      summary: {
        usersCreated: insertedUsers.length,
        ridersCreated: insertedRiders.length,
        ordersCreated: insertedOrders.length,
        deliveriesCreated: insertedDeliveries.length,
      },
      data: {
        users: insertedUsers,
        riders: insertedRiders,
        orders: insertedOrders,
        deliveries: insertedDeliveries,
      },
    };
  }
}

module.exports = new MockService();
