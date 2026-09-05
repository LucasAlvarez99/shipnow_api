const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const { createProduct, fakeObjectId } = require('./helpers/fixtures');
const { PRODUCT_STATUS } = require('../src/constants');

describe('Productos', () => {
  describe('GET /api/products', () => {
    it('lista los productos existentes, paginados', async () => {
      await createProduct({ name: 'Producto A' });
      await createProduct({ name: 'Producto B' });

      const res = await request(app).get('/api/products');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').that.has.lengthOf(2);
      expect(res.body.pagination).to.deep.equal({ page: 1, limit: 20, total: 2, totalPages: 1 });
    });

    it('respeta `page` y `limit`, devolviendo solo la porción pedida', async () => {
      await createProduct();
      await createProduct();
      await createProduct();

      const res = await request(app).get('/api/products?page=2&limit=2');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.pagination).to.deep.equal({ page: 2, limit: 2, total: 3, totalPages: 2 });
    });

    it('con `onlyAvailable=true` solo devuelve productos con stock', async () => {
      await createProduct({ stock: 5, status: PRODUCT_STATUS.AVAILABLE });
      await createProduct({ stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });

      const res = await request(app).get('/api/products?onlyAvailable=true');

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0]).to.have.property('status', PRODUCT_STATUS.AVAILABLE);
    });

    it('devuelve 400 VALIDATION_ERROR cuando `limit` supera el máximo permitido', async () => {
      const res = await request(app).get('/api/products?limit=1000');

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error.details).to.include({ field: 'limit' });
    });
  });

  describe('GET /api/products/:id', () => {
    it('devuelve el producto cuando existe', async () => {
      const product = await createProduct({ name: 'Producto Único', price: 4200 });

      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ _id: product._id.toString(), name: 'Producto Único', price: 4200 });
    });

    it('devuelve 404 con el formato de error definido cuando el producto no existe', async () => {
      const id = fakeObjectId();

      const res = await request(app).get(`/api/products/${id}`);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'PRODUCT_NOT_FOUND' });
      expect(res.body.error.details).to.deep.equal({ id });
    });
  });

  describe('POST /api/products', () => {
    it('crea un producto con stock y queda AVAILABLE', async () => {
      const payload = { name: 'Producto Nuevo', price: 999, stock: 10 };

      const res = await request(app).post('/api/products').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.include({ name: 'Producto Nuevo', price: 999, stock: 10 });
      expect(res.body).to.have.property('status', PRODUCT_STATUS.AVAILABLE);
    });

    it('crea un producto sin stock y queda OUT_OF_STOCK automáticamente', async () => {
      const payload = { name: 'Producto Sin Stock', price: 500, stock: 0 };

      const res = await request(app).post('/api/products').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('status', PRODUCT_STATUS.OUT_OF_STOCK);
    });

    it('devuelve 400 con el formato de error definido cuando faltan datos obligatorios', async () => {
      const res = await request(app).post('/api/products').send({ name: 'Incompleto' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'VALIDATION_ERROR' });
      expect(res.body.error.details.required).to.include.members(['name', 'price', 'stock']);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('actualiza el producto y recalcula el status si cambia el stock', async () => {
      const product = await createProduct({ stock: 5, status: PRODUCT_STATUS.AVAILABLE });

      const res = await request(app).put(`/api/products/${product._id}`).send({ stock: 0 });

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });
    });

    it('devuelve 404 con el formato de error definido cuando el producto no existe', async () => {
      const res = await request(app).put(`/api/products/${fakeObjectId()}`).send({ stock: 1 });

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'PRODUCT_NOT_FOUND' });
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('elimina (soft delete) el producto y deja de listarse', async () => {
      const product = await createProduct();

      const del = await request(app).delete(`/api/products/${product._id}`);
      expect(del.status).to.equal(204);

      const getAfter = await request(app).get(`/api/products/${product._id}`);
      expect(getAfter.status).to.equal(404);
      expect(getAfter.body.error).to.include({ code: 'PRODUCT_NOT_FOUND' });
    });

    it('devuelve 404 con el formato de error definido cuando el producto no existe', async () => {
      const res = await request(app).delete(`/api/products/${fakeObjectId()}`);

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'PRODUCT_NOT_FOUND' });
    });
  });
});
