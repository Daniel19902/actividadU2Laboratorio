'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
    it('debe responder con 200 y el mensaje de bienvenida', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Bienvenido a actividadU2Laboratorio CD nice');
        expect(res.body).toHaveProperty('version', '1.0.0');
        expect(res.body).toHaveProperty('timestamp');
    });
});

describe('GET /health', () => {
    it('debe responder con 200 y status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });
});

describe('GET /info', () => {
    it('debe responder con 200 e información del entorno', async () => {
        const res = await request(app).get('/info');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('env');
        expect(res.body).toHaveProperty('nodeVersion');
        expect(res.body).toHaveProperty('uptime');
    });
});

describe('GET /ruta-inexistente', () => {
    it('debe responder con 404 cuando la ruta no existe', async () => {
        const res = await request(app).get('/ruta-inexistente');
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Ruta no encontrada');
    });
});
