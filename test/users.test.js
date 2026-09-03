const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const { createUser, fakeObjectId } = require('./helpers/fixtures');

describe('Usuarios', () => {
  describe('GET /api/users', () => {
    it('devuelve una página vacía cuando no hay usuarios cargados', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').that.has.lengthOf(0);
      expect(res.body.pagination).to.deep.equal({ page: 1, limit: 20, total: 0, totalPages: 0 });
    });

    it('devuelve los usuarios existentes sin exponer el password, paginados', async () => {
      await createUser({ name: 'Ana Test' });
      await createUser({ name: 'Beto Test' });

      const res = await request(app).get('/api/users');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').that.has.lengthOf(2);
      expect(res.body.pagination).to.deep.equal({ page: 1, limit: 20, total: 2, totalPages: 1 });
      res.body.data.forEach((user) => {
        expect(user).to.have.property('name');
        expect(user).to.have.property('email');
        expect(user).to.not.have.property('password');
      });
    });

    it('respeta `page` y `limit`, devolviendo solo la porción pedida', async () => {
      await createUser({ name: 'Usuario 1' });
      await createUser({ name: 'Usuario 2' });
      await createUser({ name: 'Usuario 3' });

      const res = await request(app).get('/api/users?page=2&limit=2');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.pagination).to.deep.equal({ page: 2, limit: 2, total: 3, totalPages: 2 });
    });

    it('devuelve 400 VALIDATION_ERROR cuando `limit` supera el máximo permitido', async () => {
      const res = await request(app).get('/api/users?limit=1000');

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error.details).to.include({ field: 'limit' });
    });
  });

  describe('GET /api/users/:id', () => {
    it('devuelve 404 con el formato de error definido cuando el usuario no existe', async () => {
      const res = await request(app).get(`/api/users/${fakeObjectId()}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.include({ code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' });
    });
  });
});
