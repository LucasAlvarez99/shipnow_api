const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const { createUser, createProduct, createOrder, fakeObjectId } = require('./helpers/fixtures');
const { ORDER_STATUS } = require('../src/constants');

describe('Pedidos', () => {
  describe('GET /api/orders', () => {
    it('lista los pedidos existentes con el usuario populado, paginados', async () => {
      await createOrder();

      const res = await request(app).get('/api/orders');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').that.has.lengthOf(1);
      expect(res.body.data[0]).to.have.property('totalAmount');
      expect(res.body.data[0]).to.have.property('user');
      expect(res.body.data[0].user).to.have.property('email');
      expect(res.body.pagination).to.deep.equal({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('respeta `page` y `limit`, devolviendo solo la porción pedida', async () => {
      await createOrder();
      await createOrder();
      await createOrder();

      const res = await request(app).get('/api/orders?page=2&limit=2');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.pagination).to.deep.equal({ page: 2, limit: 2, total: 3, totalPages: 2 });
    });

    it('devuelve 400 VALIDATION_ERROR cuando `page` no es un entero válido', async () => {
      const res = await request(app).get('/api/orders?page=abc');

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error.details).to.include({ field: 'page' });
    });
  });

  describe('GET /api/orders/:id', () => {
    it('devuelve el pedido con su estructura completa cuando existe', async () => {
      const order = await createOrder({ totalAmount: 4200 });

      const res = await request(app).get(`/api/orders/${order._id}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ _id: order._id.toString(), totalAmount: 4200 });
      expect(res.body).to.have.property('status', ORDER_STATUS.PENDING);
      expect(res.body).to.have.property('items').that.is.an('array');
    });

    it('devuelve 404 con el formato de error definido cuando el pedido no existe', async () => {
      const id = fakeObjectId();

      const res = await request(app).get(`/api/orders/${id}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include({ code: 'ORDER_NOT_FOUND' });
      expect(res.body.error.details).to.deep.equal({ id });
    });
  });

  describe('POST /api/orders', () => {
    it('crea un pedido cuando los datos son válidos', async () => {
      const user = await createUser();
      const product = await createProduct();

      const payload = {
        user: user._id.toString(),
        items: [{ product: product._id.toString(), quantity: 3 }],
        totalAmount: 5000,
      };

      const res = await request(app).post('/api/orders').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.include({ totalAmount: 5000, status: ORDER_STATUS.PENDING });
      expect(res.body.items).to.have.lengthOf(1);
      expect(res.body.items[0]).to.include({ quantity: 3 });
    });

    it('devuelve 400 con el formato de error definido cuando faltan datos obligatorios', async () => {
      const res = await request(app).post('/api/orders').send({ items: [] });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error.details.required).to.include.members(['user', 'items', 'totalAmount']);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('actualiza el estado del pedido a un valor válido', async () => {
      const order = await createOrder();

      const res = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .send({ status: ORDER_STATUS.CONFIRMED });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', ORDER_STATUS.CONFIRMED);
    });

    it('devuelve 400 con el formato de error definido cuando el estado no es válido', async () => {
      const order = await createOrder();

      const res = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .send({ status: 'ESTADO_INEXISTENTE' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_STATUS' });
      expect(res.body.error.details).to.have.property('received', 'ESTADO_INEXISTENTE');
    });

    it('devuelve 404 al intentar actualizar el estado de un pedido inexistente', async () => {
      const res = await request(app)
        .patch(`/api/orders/${fakeObjectId()}/status`)
        .send({ status: ORDER_STATUS.CONFIRMED });

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'ORDER_NOT_FOUND' });
    });
  });
});
