const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/logger/test', () => {
  it('dispara los logs de prueba y devuelve el resumen esperado', async () => {
    const res = await request(app).get('/api/logger/test');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message').that.is.a('string');
    expect(res.body).to.have.property('revisar');
    expect(res.body.revisar).to.have.all.keys('consola', 'archivo');
  });
});
