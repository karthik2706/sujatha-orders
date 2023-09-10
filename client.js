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

app.get('/getOrders', (req, res) => {
    console.log('getOrders called');
    // Establish a connection to the database and execute SQL queries here
    db.query('SELECT * FROM orders', (error, results) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results);
        }
    });
});

// Define a route to get an order by ID
app.get('/getOrder/:orderId', (req, res) => {
    // Extract the orderId from the URL parameters
    const orderId = req.params.orderId;
    console.log('orderId is', orderId);
    // Establish a connection to the database and execute the SQL query
    db.query('SELECT * FROM orders WHERE id = ?', [orderId], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database error' });
        } else {
            // Check if a result was found
            if (results.length === 0) {
                res.status(404).json({ error: 'Order not found' });
            } else {
                // Send the order data as JSON response
                res.json(results[0]); // Assuming there's only one order with the given ID
            }
        }
    });
});

// Define a route to get an order by ID
app.get('/updateOrder/:orderId/:tracking', (req, res) => {
    // Extract the orderId from the URL parameters
    const orderId = req.params.orderId;
    const updatedField = req.params.tracking;

    console.log('tracking is', updatedField);

    // Fetch the order based on its ID
    db.query('SELECT * FROM orders WHERE id = ?', [orderId], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database error' });
        } else {
            if (results.length === 0) {
                res.status(404).json({ error: 'Order not found' });
            } else {
                // Update the field in the order data
                const order = results[0];
                order.tracking = updatedField;

                // Execute the update query
                db.query('UPDATE orders SET tracking = ? WHERE id = ?', [updatedField, orderId], (updateError) => {
                    if (updateError) {
                        console.error('Database update error:', updateError);
                        res.status(500).json({ error: 'Database update error' });
                    } else {
                        res.json({ message: 'Order updated successfully' });
                    }
                });

                // db.end((endError) => {
                //   if (endError) {
                //     console.error('Error closing the database connection:', endError);
                //   } else {
                //     console.log('Database connection closed.');
                //   }
                // });
            }
        }
    });
});

app.post('/createOrder', (req, res) => {
    const ordersData = [];
    var orderid;
    ordersData.push(req.body); // Access the data sent in the request body
    // console.log(ordersData);

    // Insert each record into the "orders" table
    ordersData.forEach((order, index) => {
        const sql = `
        INSERT INTO orders (address, city, cod, codprice, country, email, mobile, name, pickupD, pincode, price, qty, ref, rmobile, rname, state, time, tracking, vendor, weight)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const values = [
            order.address,
            order.city,
            order.cod,
            order.codprice,
            order.country,
            order.email,
            order.mobile,
            order.name,
            order.pickupD,
            order.pincode,
            order.price,
            order.qty,
            order.ref,
            order.rmobile,
            order.rname,
            order.state,
            order.time,
            order.tracking,
            order.vendor,
            order.weight,
        ];

        db.query(sql, values, (insertError, results) => {
            if (insertError) {
                console.error('Error inserting record:', insertError);
            } else {
                console.log('Record inserted:', results);
                res.json(results);
            }
        });

        // Close the database connection
        // db.end((endError) => {
        //   if (endError) {
        //     console.error('Error closing the database connection:', endError);
        //   } else {
        //     console.log('Database connection closed.');
        //   }
        // });
    });
});

app.get('/getOrdersByMobile/:mobile', (req, res) => {
    const mobileNumber = req.params.mobile; // Get the mobile number from the URL parameter
    console.log(mobileNumber)
    // Construct an SQL query to fetch orders with the specified mobile number
    const sql = 'SELECT * FROM orders WHERE mobile = ?';

    // Execute the SQL query
    db.query(sql, [mobileNumber], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results);
        }
    });
});

app.put('/updateOrderDetails/:id', (req, res) => {
    const orderId = req.params.id; // Get the order ID from the URL parameter

    // Retrieve the updated order data from the request body
    const updatedOrder = req.body;

    // Assuming you have a MySQL database connection named "db"
    // Update the order in the database based on the order ID
    const sql = `
      UPDATE orders
      SET
        address = ?,
        city = ?,
        cod = ?,
        codprice = ?,
        country = ?,
        email = ?,
        mobile = ?,
        name = ?,
        pickupD = ?,
        pincode = ?,
        price = ?,
        qty = ?,
        ref = ?,
        rmobile = ?,
        rname = ?,
        state = ?,
        time = ?,
        tracking = ?,
        vendor = ?,
        weight = ?
      WHERE id = ?`; // Assuming "id" is the primary key column in your "orders" table

    const values = [
        updatedOrder.address,
        updatedOrder.city,
        updatedOrder.cod,
        updatedOrder.codprice,
        updatedOrder.country,
        updatedOrder.email,
        updatedOrder.mobile,
        updatedOrder.name,
        updatedOrder.pickupD,
        updatedOrder.pincode,
        updatedOrder.price,
        updatedOrder.qty,
        updatedOrder.ref,
        updatedOrder.rmobile,
        updatedOrder.rname,
        updatedOrder.state,
        updatedOrder.time,
        updatedOrder.tracking,
        updatedOrder.vendor,
        updatedOrder.weight,
        orderId, // The last value is the order ID
    ];

    // Execute the SQL update query
    db.query(sql, values, (updateError, results) => {
        if (updateError) {
            console.error('Error updating order:', updateError);
            res.status(500).json({ error: 'Error updating order' });
        } else {
            console.log('Order updated successfully');
            res.json(results);
        }
    });
});

// Create an API endpoint to delete multiple entries by IDs
app.post('/deleteOrders', (req, res) => {
    const idsToDelete = req.body; // An array of order IDs to delete
    console.log(idsToDelete);
    if (!Array.isArray(idsToDelete) || idsToDelete.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty list of IDs' });
    }

    // Construct the SQL query using a placeholder for the IDs
    const query = 'DELETE FROM orders WHERE id IN (?)';

    // Execute the query with the list of IDs
    db.query(query, [idsToDelete], (error, result) => {
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ message: `${result.affectedRows} orders deleted successfully` });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login Called');
    console.log(username, password);
    // Query the database to check if the user exists
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            if (results.length === 1) {
                // User exists and credentials are correct
                res.status(200).json({ message: 'Login successful' });
            } else {
                // User doesn't exist or credentials are incorrect
                res.status(401).json({ error: 'Authentication failed' });
            }
        }
    });
});

// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start listening on the HTTPS port (443)
httpsServer.listen(process.env.PORT || 443, () => {
    console.log(`Server is running on port ${process.env.PORT || 443} (HTTPS)`);
});
