const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// Load SSL/TLS certificates
const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Serve static files from the root directory
app.use(express.static(__dirname));

// Define a route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Define a route for the redirection
app.get('/omsServices/*', (req, res) => {
    // Get the wildcard path
    const wildcardPath = req.params[0];

    // Redirect to the target URL
    res.redirect(`http://srv418021.hstgr.cloud:3000/${wildcardPath}`);
});

// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start listening on the HTTPS port (443)
httpsServer.listen(process.env.PORT || 443, () => {
  console.log(`Server is running on port ${process.env.PORT || 443} (HTTPS)`);
});
