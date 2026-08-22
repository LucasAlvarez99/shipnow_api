const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/docs', () => {
  it('sirve la interfaz de Swagger UI', async () => {
    const res = await request(app).get('/api/docs/');

    expect(res.status).to.equal(200);
    expect(res.type).to.equal('text/html');
    expect(res.text).to.include('swagger-ui');
  });
});
