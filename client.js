const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const app = express();
const bodyParser = require('body-parser');

const db = mysql.createConnection({
    host: 'srv1086.hstgr.io',
    user: 'u400549820_sujatha',
    password: 'Darling@2706',
    database: 'u400549820_sujatha_oms',
    keepAlive: true,
});

// Load SSL/TLS certificates
const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Serve static files from the root directory
app.use(express.static(__dirname));

app.use(bodyParser.json());

// Define a route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Define a route
app.get('/test', (req, res) => {
    res.send('Hello, Node.js server!');
});

app.get('/getProfile', (req, res) => {
    console.log('getProfile called');
    // Establish a connection to the database and execute SQL queries here
    db.query('SELECT * FROM profile', (error, results) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results[0]);
        }
    });
});

// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start listening on the HTTPS port (443)
httpsServer.listen(process.env.PORT || 443, () => {
    console.log(`Server is running on port ${process.env.PORT || 443} (HTTPS)`);
});
