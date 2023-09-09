const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

// Load SSL/TLS certificates
const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start listening on the HTTPS port (443)
httpsServer.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT} (HTTPS)`);
});

// Define your routes and middleware here
// ...
