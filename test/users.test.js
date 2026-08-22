const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const { createUser, fakeObjectId } = require('./helpers/fixtures');

describe('Usuarios', () => {
  describe('GET /api/users', () => {
    it('devuelve un array vacío cuando no hay usuarios cargados', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.has.lengthOf(0);
    });

    it('devuelve los usuarios existentes sin exponer el password', async () => {
      await createUser({ name: 'Ana Test' });
      await createUser({ name: 'Beto Test' });

      const res = await request(app).get('/api/users');

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.has.lengthOf(2);
      res.body.forEach((user) => {
        expect(user).to.have.property('name');
        expect(user).to.have.property('email');
        expect(user).to.not.have.property('password');
      });
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
