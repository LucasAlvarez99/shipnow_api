const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const { createOrder, createUser, createDelivery, fakeObjectId } = require('./helpers/fixtures');
const { DELIVERY_STATUS, USER_ROLES } = require('../src/constants');

describe('Entregas', () => {
  describe('GET /api/deliveries', () => {
    it('lista las entregas existentes con pedido y repartidor populados, paginadas', async () => {
      await createDelivery();

      const res = await request(app).get('/api/deliveries');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').that.has.lengthOf(1);
      expect(res.body.data[0]).to.have.property('status', DELIVERY_STATUS.ASSIGNED);
      expect(res.body.data[0]).to.have.property('order').that.is.an('object');
      expect(res.body.data[0]).to.have.property('rider').that.has.property('email');
      expect(res.body.pagination).to.deep.equal({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('respeta `page` y `limit`, devolviendo solo la porción pedida', async () => {
      await createDelivery();
      await createDelivery();
      await createDelivery();

      const res = await request(app).get('/api/deliveries?page=2&limit=2');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.pagination).to.deep.equal({ page: 2, limit: 2, total: 3, totalPages: 2 });
    });

    it('filtra por `status`', async () => {
      await createDelivery({ status: DELIVERY_STATUS.ASSIGNED });
      await createDelivery({ status: DELIVERY_STATUS.COMPLETED });

      const res = await request(app).get(`/api/deliveries?status=${DELIVERY_STATUS.COMPLETED}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0]).to.have.property('status', DELIVERY_STATUS.COMPLETED);
    });
  });

  describe('GET /api/deliveries/:id', () => {
    it('devuelve la entrega con su estructura completa cuando existe', async () => {
      const delivery = await createDelivery();

      const res = await request(app).get(`/api/deliveries/${delivery._id}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ _id: delivery._id.toString() });
      expect(res.body).to.have.property('order').that.is.an('object');
    });

    it('devuelve 404 con el formato de error definido cuando la entrega no existe', async () => {
      const id = fakeObjectId();

      const res = await request(app).get(`/api/deliveries/${id}`);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'DELIVERY_NOT_FOUND' });
      expect(res.body.error.details).to.deep.equal({ id });
    });
  });

  describe('POST /api/deliveries', () => {
    it('crea una entrega cuando los datos son válidos', async () => {
      const order = await createOrder();
      const rider = await createUser({ role: USER_ROLES.DELIVERY });

      const payload = { order: order._id.toString(), rider: rider._id.toString() };

      const res = await request(app).post('/api/deliveries').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('status', DELIVERY_STATUS.ASSIGNED);
    });

    it('devuelve 400 con el formato de error definido cuando faltan datos obligatorios', async () => {
      const res = await request(app).post('/api/deliveries').send({});

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error.details.required).to.include.members(['order', 'rider']);
    });
  });

  describe('PATCH /api/deliveries/:id/status', () => {
    it('actualiza el estado de la entrega a un valor válido', async () => {
      const delivery = await createDelivery();

      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .send({ status: DELIVERY_STATUS.IN_PROGRESS });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', DELIVERY_STATUS.IN_PROGRESS);
    });

    it('devuelve 400 con el formato de error definido cuando el estado no es válido', async () => {
      const delivery = await createDelivery();

      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .send({ status: 'ESTADO_INEXISTENTE' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_STATUS' });
      expect(res.body.error.details).to.have.property('received', 'ESTADO_INEXISTENTE');
    });

    it('devuelve 404 al intentar actualizar el estado de una entrega inexistente', async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${fakeObjectId()}/status`)
        .send({ status: DELIVERY_STATUS.COMPLETED });

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'DELIVERY_NOT_FOUND' });
    });
  });

  describe('DELETE /api/deliveries/:id', () => {
    it('elimina (soft delete) la entrega y deja de listarse', async () => {
      const delivery = await createDelivery();

      const del = await request(app).delete(`/api/deliveries/${delivery._id}`);
      expect(del.status).to.equal(204);

      const getAfter = await request(app).get(`/api/deliveries/${delivery._id}`);
      expect(getAfter.status).to.equal(404);
      expect(getAfter.body.error).to.include({ code: 'DELIVERY_NOT_FOUND' });
    });

    it('devuelve 404 con el formato de error definido cuando la entrega no existe', async () => {
      const res = await request(app).delete(`/api/deliveries/${fakeObjectId()}`);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'DELIVERY_NOT_FOUND' });
    });
  });
});
