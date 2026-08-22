const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');

describe('Ruta inexistente', () => {
  it('devuelve 404 con el formato de error uniforme para cualquier ruta no manejada', async () => {
    const res = await request(app).get('/api/esto-no-existe');

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error');
    expect(res.body.error).to.include({ code: 'ROUTE_NOT_FOUND' });
    expect(res.body.error.message).to.be.a('string');
  });
});
