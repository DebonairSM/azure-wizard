// Start legacy v1 server on a non-conflicting default port (3031) unless PORT is already set.
process.env.PORT = process.env.PORT || '3031';

// Ensure .env is loaded and config is generated as in v1 startup
await import('../server.js');






