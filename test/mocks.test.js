const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');

describe('Mocks', () => {
  describe('GET /api/mocks (preview en memoria)', () => {
    it('genera un preview con las cantidades solicitadas sin guardar nada en la base', async () => {
      const res = await request(app).get('/api/mocks?users=3&orders=2&deliveries=2');

      expect(res.status).to.equal(200);
      expect(res.body.users).to.have.lengthOf(3);
      expect(res.body.orders).to.have.lengthOf(2);
      expect(res.body.deliveries).to.have.lengthOf(2);
      expect(res.body.users[0]).to.have.property('email');

      const usersInDb = await User.countDocuments();
      expect(usersInDb).to.equal(0);
    });

    it('devuelve 400 con el formato de error definido cuando la cantidad es inválida', async () => {
      const res = await request(app).get('/api/mocks?users=-1');

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include({ code: 'INVALID_MOCK_QUANTITY' });
      expect(res.body.error.details).to.include({ field: 'users' });
    });
  });

  describe('POST /api/mocks/seed (inserción real en Mongo)', () => {
    it('inserta usuarios, repartidores, pedidos y entregas en la base', async () => {
      const res = await request(app)
        .post('/api/mocks/seed')
        .send({ users: 2, orders: 2, deliveries: 2 });

      expect(res.status).to.equal(201);
      expect(res.body.summary).to.deep.equal({
        usersCreated: 2,
        ridersCreated: 1,
        ordersCreated: 2,
        deliveriesCreated: 2,
      });

      const usersInDb = await User.countDocuments();
      expect(usersInDb).to.equal(3); // 2 usuarios + 1 repartidor
    });

    it('devuelve 400 con el formato de error definido cuando la cantidad no es numérica', async () => {
      const res = await request(app).post('/api/mocks/seed').send({ users: 'muchos' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_MOCK_QUANTITY' });

      const usersInDb = await User.countDocuments();
      expect(usersInDb).to.equal(0);
    });
  });
});
