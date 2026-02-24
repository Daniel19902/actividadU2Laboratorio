'use strict';

const express = require('express');

const app = express();

app.use(express.json());

/**
 * GET /
 * Endpoint principal de la aplicación.
 */
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Bienvenido a actividadU2Laboratorio CD nice',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /health
 * Health-check usado por orquestadores (Kubernetes, Docker, etc.)
 */
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

/**
 * GET /info
 * Devuelve información del entorno de ejecución.
 */
app.get('/info', (req, res) => {
    res.status(200).json({
        env: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: process.uptime(),
    });
});

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;
