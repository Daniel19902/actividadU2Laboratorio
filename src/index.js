'use strict';

const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[app] Servidor corriendo en http://localhost:${PORT}`);
  console.log(`[app] Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[app] SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('[app] Servidor cerrado.');
    process.exit(0);
  });
});

module.exports = server;
