const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('devuelve el estado de la API sin exponer información sensible', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'ok');
    expect(res.body).to.have.property('environment', 'test');
    expect(res.body).to.have.property('uptime').that.is.a('number');
    expect(res.body).to.have.property('timestamp').that.is.a('string');

    // Nunca debe filtrar detalles de infraestructura.
    expect(res.body).to.not.have.property('mongodbUri');
    expect(JSON.stringify(res.body)).to.not.include('mongodb://');
  });
});
