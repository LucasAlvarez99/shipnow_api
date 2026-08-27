const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const { createUser, createDelivery, fakeObjectId } = require('./helpers/fixtures');
const { validPdfBuffer, oversizedBuffer, cleanupUploadedFile } = require('./helpers/testFiles');
const { USER_DOCUMENT_TYPES, DELIVERY_DOCUMENT_TYPE, FILE_UPLOAD } = require('../src/constants');

describe('Carga de archivos (Módulo 7)', () => {
  // Los endpoints de este módulo escriben archivos reales en `uploads/`.
  // Cada test que sube un archivo válido registra acá la ruta devuelta
  // para borrarla al terminar, así la suite no deja basura acumulada en
  // disco entre corridas. Los casos que fallan por una validación de
  // negocio (documentType inválido, entidad inexistente) no necesitan
  // este cleanup: la propia app ya borra el archivo huérfano.
  const filesToCleanUp = [];

  afterEach(async () => {
    await Promise.all(filesToCleanUp.splice(0).map(cleanupUploadedFile));
  });

  describe('POST /api/users/:id/documents', () => {
    it('sube un documento de usuario correctamente y registra sus metadatos', async () => {
      const user = await createUser();

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', USER_DOCUMENT_TYPES.DNI)
        .attach('file', validPdfBuffer(), { filename: 'dni.pdf', contentType: 'application/pdf' });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('documents').that.is.an('array').with.lengthOf(1);

      const document = res.body.documents[0];
      expect(document).to.include({ originalName: 'dni.pdf', documentType: USER_DOCUMENT_TYPES.DNI });
      expect(document).to.have.property('generatedName');
      expect(document).to.have.property('path').that.includes('documentos-usuario');
      filesToCleanUp.push(document.path);
    });

    it('devuelve 400 FILE_REQUIRED cuando no se adjunta ningún archivo', async () => {
      const user = await createUser();

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', USER_DOCUMENT_TYPES.DNI);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'FILE_REQUIRED' });
    });

    it('devuelve 400 INVALID_DOCUMENT_TYPE cuando el tipo de documento no es válido', async () => {
      const user = await createUser();

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', 'PASAPORTE')
        .attach('file', validPdfBuffer(), { filename: 'doc.pdf', contentType: 'application/pdf' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_DOCUMENT_TYPE' });
      expect(res.body.error.details).to.have.property('received', 'PASAPORTE');
      // No debe quedar el archivo huérfano en disco: la app lo borra sola.
      expect(res.body).to.not.have.property('documents');
    });

    it('devuelve 400 INVALID_FILE_TYPE cuando el tipo de archivo no está permitido', async () => {
      const user = await createUser();

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', USER_DOCUMENT_TYPES.DNI)
        .attach('file', Buffer.from('contenido de texto plano'), {
          filename: 'documento.txt',
          contentType: 'text/plain',
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'INVALID_FILE_TYPE' });
      expect(res.body.error.details).to.have.property('received', 'text/plain');
    });

    it('devuelve 400 FILE_TOO_LARGE cuando el archivo supera el tamaño máximo', async () => {
      const user = await createUser();
      const tooBig = oversizedBuffer(FILE_UPLOAD.MAX_FILE_SIZE_BYTES + 1024);

      const res = await request(app)
        .post(`/api/users/${user._id}/documents`)
        .field('documentType', USER_DOCUMENT_TYPES.DNI)
        .attach('file', tooBig, { filename: 'grande.pdf', contentType: 'application/pdf' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'FILE_TOO_LARGE' });
    });

    it('devuelve 404 USER_NOT_FOUND cuando el usuario no existe', async () => {
      const id = fakeObjectId();

      const res = await request(app)
        .post(`/api/users/${id}/documents`)
        .field('documentType', USER_DOCUMENT_TYPES.DNI)
        .attach('file', validPdfBuffer(), { filename: 'dni.pdf', contentType: 'application/pdf' });

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'USER_NOT_FOUND' });
    });
  });

  describe('POST /api/deliveries/:id/proof', () => {
    it('sube un comprobante de entrega correctamente y registra sus metadatos', async () => {
      const delivery = await createDelivery();

      const res = await request(app)
        .post(`/api/deliveries/${delivery._id}/proof`)
        .attach('file', validPdfBuffer(), { filename: 'comprobante.pdf', contentType: 'application/pdf' });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('proofs').that.is.an('array').with.lengthOf(1);

      const proof = res.body.proofs[0];
      expect(proof).to.include({ originalName: 'comprobante.pdf', documentType: DELIVERY_DOCUMENT_TYPE });
      expect(proof).to.have.property('path').that.includes('comprobantes-entrega');
      filesToCleanUp.push(proof.path);
    });

    it('devuelve 400 FILE_REQUIRED cuando no se adjunta ningún archivo', async () => {
      const delivery = await createDelivery();

      const res = await request(app).post(`/api/deliveries/${delivery._id}/proof`);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include({ code: 'FILE_REQUIRED' });
    });

    it('devuelve 404 DELIVERY_NOT_FOUND cuando la entrega no existe', async () => {
      const id = fakeObjectId();

      const res = await request(app)
        .post(`/api/deliveries/${id}/proof`)
        .attach('file', validPdfBuffer(), { filename: 'comprobante.pdf', contentType: 'application/pdf' });

      expect(res.status).to.equal(404);
      expect(res.body.error).to.include({ code: 'DELIVERY_NOT_FOUND' });
    });
  });
});
