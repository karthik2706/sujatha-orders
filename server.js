const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


const app = express();

const dbConfig = {
  host: 'srv1086.hstgr.io',
  user: 'u400549820_sujatha',
  password: 'Darling@2706',
  database: 'u400549820_sujatha_oms',
  connectionLimit: 10, // Set your preferred connection pool size
};

const pool = mysql.createPool(dbConfig);

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello, Node.js server!');
});

// Enable CORS for the /getOrders route
app.use('/getOrders', cors());

app.get('/getOrders', (req, res) => {
  console.log('getOrders called');
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection error:', err);
      res.status(500).json({ error: 'Database connection error' });
    } else {
      connection.query('SELECT * FROM orders', (error, results) => {
        connection.release();
        if (error) {
          console.error('Database error:', error);
          res.status(500).json({ error: 'Database error' });
        } else {
          res.json(results);
        }
      });
    }
  });
});

// Other routes can be similarly optimized using connection pooling

// Start listening on the HTTP port (8080)
app.listen(process.env.PORT || 8080, () => {
  console.log(`Server is running on port ${process.env.PORT || 8080} (HTTP)`);
});




// app.get('/getOrders', (req, res) => {
//   console.log('getOrders called');
//   // Establish a connection to the database and execute SQL queries here
//   db.query('SELECT * FROM orders', (error, results) => {
//     if (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Database error' });
//     } else {
//       res.json(results);
//     }
//   });
// });

app.use('/getOrder/:orderId', cors());
app.get('/getOrder/:orderId', async (req, res) => {
  // Extract the orderId from the URL parameters
  const orderId = req.params.orderId;
  console.log('orderId is', orderId);

  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    connection.release(); // Release the connection back to the pool

    // Check if a result was found
    if (results.length === 0) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      // Send the order data as a JSON response
      res.json(results[0]); // Assuming there's only one order with the given ID
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Define a route to get an order by ID
// app.get('/getOrder/:orderId', (req, res) => {
//   // Extract the orderId from the URL parameters
//   const orderId = req.params.orderId;
//   console.log('orderId is', orderId);
//   // Establish a connection to the database and execute the SQL query
//   db.query('SELECT * FROM orders WHERE id = ?', [orderId], (error, results) => {
//     if (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Database error' });
//     } else {
//       // Check if a result was found
//       if (results.length === 0) {
//         res.status(404).json({ error: 'Order not found' });
//       } else {
//         // Send the order data as JSON response
//         res.json(results[0]); // Assuming there's only one order with the given ID
//       }
//     }
//   });
// });

app.use('/updateOrder/:orderId/:tracking', cors());
app.get('/updateOrder/:orderId/:tracking', async (req, res) => {
  // Extract the orderId from the URL parameters
  const orderId = req.params.orderId;
  const updatedField = req.params.tracking;
  console.log('tracking is', updatedField);

  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();
    const [orderResults] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (orderResults.length === 0) {
      connection.release();
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = orderResults[0];
    order.tracking = updatedField;

    // Execute the update query
    await connection.query('UPDATE orders SET tracking = ? WHERE id = ?', [updatedField, orderId]);
    connection.release();

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Define a route to get an order by ID
// app.get('/updateOrder/:orderId/:tracking', (req, res) => {
//   // Extract the orderId from the URL parameters
//   const orderId = req.params.orderId;
//   const updatedField = req.params.tracking;
  
//   console.log('tracking is', updatedField);
 
//   // Fetch the order based on its ID
//   db.query('SELECT * FROM orders WHERE id = ?', [orderId], (error, results) => {
//     if (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Database error' });
//     } else {
//       if (results.length === 0) {
//         res.status(404).json({ error: 'Order not found' });
//       } else {
//         // Update the field in the order data
//         const order = results[0];
//         order.tracking = updatedField;

//         // Execute the update query
//         db.query('UPDATE orders SET tracking = ? WHERE id = ?', [updatedField, orderId], (updateError) => {
//           if (updateError) {
//             console.error('Database update error:', updateError);
//             res.status(500).json({ error: 'Database update error' });
//           } else {
//             res.json({ message: 'Order updated successfully' });
//           }
//         });

//       }
//     }
//   });
// });


app.use('/getProfile', cors());
app.get('/getProfile', async (req, res) => {
  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();
    const [profileResults] = await connection.query('SELECT * FROM profile');
    connection.release();

    if (profileResults.length === 0) {
      res.status(404).json({ error: 'Profile not found' });
    } else {
      res.json(profileResults[0]);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});
// app.get('/getProfile', (req, res) => {
//   console.log('getProfile called');
//   // Establish a connection to the database and execute SQL queries here
//   db.query('SELECT * FROM profile', (error, results) => {
//     if (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Database error' });
//     } else {
//       res.json(results[0]);
//     }
//   });
// });

app.use('/createOrder', cors());
app.post('/createOrder', async (req, res) => {
  const ordersData = req.body; // Assuming req.body is an array of order data objects

  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();
    const insertPromises = ordersData.map(async (order) => {
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

      // Use 'await' to execute the insert query and resolve the promise
      await connection.query(sql, values);
    });

    // Use Promise.all to wait for all insertPromises to complete
    await Promise.all(insertPromises);

    connection.release();
    res.json({ message: 'Records inserted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// app.post('/createOrder', (req, res)=> {
//   const ordersData = [];
//   var orderid;
//   ordersData.push(req.body); // Access the data sent in the request body
//   // console.log(ordersData);
  
//    // Insert each record into the "orders" table
//    ordersData.forEach((order, index) => {
//     const sql = `
//       INSERT INTO orders (address, city, cod, codprice, country, email, mobile, name, pickupD, pincode, price, qty, ref, rmobile, rname, state, time, tracking, vendor, weight)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const values = [
//       order.address,
//       order.city,
//       order.cod,
//       order.codprice,
//       order.country,
//       order.email,
//       order.mobile,
//       order.name,
//       order.pickupD,
//       order.pincode,
//       order.price,
//       order.qty,
//       order.ref,
//       order.rmobile,
//       order.rname,
//       order.state,
//       order.time,
//       order.tracking,
//       order.vendor,
//       order.weight,
//     ];

//     db.query(sql, values, (insertError, results) => {
//       if (insertError) {
//         console.error('Error inserting record:', insertError);
//       } else {
//         console.log('Record inserted:', results);
//         res.json(results);
//       }
//     });
//   });
// });

app.use('/getOrdersByMobile/:mobile', cors());
app.get('/getOrdersByMobile/:mobile', async (req, res) => {
  const mobileNumber = req.params.mobile;

  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();
    
    const sql = 'SELECT * FROM orders WHERE mobile = ?';
    
    // Use 'await' to execute the query and get the results
    const results = await connection.query(sql, [mobileNumber]);

    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Define a route to fetch orders based on 'mobile'
// app.get('/getOrdersByMobile/:mobile', (req, res) => {
//   const mobileNumber = req.params.mobile; // Get the mobile number from the URL parameter
//   console.log(mobileNumber)
//   // Construct an SQL query to fetch orders with the specified mobile number
//   const sql = 'SELECT * FROM orders WHERE mobile = ?';

//   // Execute the SQL query
//   db.query(sql, [mobileNumber], (error, results) => {
//     if (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Database error' });
//     } else {
//       res.json(results);
//     }
//   });
// });


app.use('/updateOrderDetails/:id', cors());
app.put('/updateOrderDetails/:id', async (req, res) => {
  const orderId = req.params.id; // Get the order ID from the URL parameter

  // Retrieve the updated order data from the request body
  const updatedOrder = req.body;

  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();

    // Define the SQL update query
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
      WHERE id = ?`;

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

    // Use 'await' to execute the SQL update query
    const results = await connection.query(sql, values);

    connection.release(); // Release the connection back to the pool

    console.log('Order updated successfully');
    res.json(results);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Error updating order' });
  }
});

// Define a route to update an order by ID
// app.put('/updateOrderDetails/:id', (req, res) => {
//   const orderId = req.params.id; // Get the order ID from the URL parameter

//   // Retrieve the updated order data from the request body
//   const updatedOrder = req.body;

//   // Assuming you have a MySQL database connection named "db"
//   // Update the order in the database based on the order ID
//   const sql = `
//     UPDATE orders
//     SET
//       address = ?,
//       city = ?,
//       cod = ?,
//       codprice = ?,
//       country = ?,
//       email = ?,
//       mobile = ?,
//       name = ?,
//       pickupD = ?,
//       pincode = ?,
//       price = ?,
//       qty = ?,
//       ref = ?,
//       rmobile = ?,
//       rname = ?,
//       state = ?,
//       time = ?,
//       tracking = ?,
//       vendor = ?,
//       weight = ?
//     WHERE id = ?`; // Assuming "id" is the primary key column in your "orders" table

//   const values = [
//     updatedOrder.address,
//     updatedOrder.city,
//     updatedOrder.cod,
//     updatedOrder.codprice,
//     updatedOrder.country,
//     updatedOrder.email,
//     updatedOrder.mobile,
//     updatedOrder.name,
//     updatedOrder.pickupD,
//     updatedOrder.pincode,
//     updatedOrder.price,
//     updatedOrder.qty,
//     updatedOrder.ref,
//     updatedOrder.rmobile,
//     updatedOrder.rname,
//     updatedOrder.state,
//     updatedOrder.time,
//     updatedOrder.tracking,
//     updatedOrder.vendor,
//     updatedOrder.weight,
//     orderId, // The last value is the order ID
//   ];

//   // Execute the SQL update query
//   db.query(sql, values, (updateError, results) => {
//     if (updateError) {
//       console.error('Error updating order:', updateError);
//       res.status(500).json({ error: 'Error updating order' });
//     } else {
//       console.log('Order updated successfully');
//       res.json(results);
//     }
//   });
// });

app.use('/login', cors());
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login Called');
  console.log(username, password);

  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();

    // Query the database to retrieve the user by username
    const query = 'SELECT * FROM users WHERE username = ?';
    const [userResults] = await connection.query(query, [username]);

    if (userResults.length === 1) {
      // User with the given username exists
      const user = userResults[0];

      // Compare the hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // Passwords match, authentication successful
        res.status(200).json({ message: 'Login successful' });
      } else {
        // Passwords don't match, authentication failed
        res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      // User with the given username doesn't exist
      res.status(401).json({ error: 'Authentication failed' });
    }

    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.use('/deleteOrders', cors());
app.post('/deleteOrders', async (req, res) => {
  const idsToDelete = req.body; // An array of order IDs to delete
  console.log(idsToDelete);

  if (!Array.isArray(idsToDelete) || idsToDelete.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty list of IDs' });
  }

  try {
    // Use 'await' to wait for a connection from the pool
    const connection = await pool.getConnection();

    // Construct the SQL query using a placeholder for the IDs
    const query = 'DELETE FROM orders WHERE id IN (?)';

    // Execute the query with the list of IDs
    const [result] = await connection.query(query, [idsToDelete]);

    // Release the connection back to the pool
    connection.release();

    res.json({ message: `${result.affectedRows} orders deleted successfully` });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create an API endpoint to delete multiple entries by IDs
// app.post('/deleteOrders', (req, res) => {
//   const idsToDelete = req.body; // An array of order IDs to delete
//   console.log(idsToDelete);
//   if (!Array.isArray(idsToDelete) || idsToDelete.length === 0) {
//     return res.status(400).json({ error: 'Invalid or empty list of IDs' });
//   }

//   // Construct the SQL query using a placeholder for the IDs
//   const query = 'DELETE FROM orders WHERE id IN (?)';

//   // Execute the query with the list of IDs
//   db.query(query, [idsToDelete], (error, result) => {
//     if (error) {
//       console.error('Database error:', error);
//       res.status(500).json({ error: 'Database error' });
//     } else {
//       res.json({ message: `${result.affectedRows} orders deleted successfully` });
//     }
//   });
// });