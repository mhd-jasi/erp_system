const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 5000;


// Middleware
app.use(cors());
app.use(express.json()); // Use built-in express JSON parser
app.use('/uploads', express.static('uploads'));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // default XAMPP user
  password: '', // default XAMPP password is empty
  database: 'erp_software' // your database name
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err.stack);
    return;
  }
  console.log('Connected to database.');
});

// API to get all inventory
app.get('/api/inventory', (req, res) => {
  const sql = 'SELECT * FROM inventory';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching inventory:', err);
      return res.status(500).json({ error: 'Failed to fetch inventory' });
    }
    res.json(result);
  });
});

// New API to get inventory quantities for multiple products
app.post('/api/inventory/quantities', (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ message: 'productIds must be a non-empty array' });
  }

  // Use placeholders for SQL IN clause
  const placeholders = productIds.map(() => '?').join(',');
  const sql = `SELECT id, quantity FROM inventory WHERE id IN (${placeholders})`;

  db.query(sql, productIds, (err, results) => {
    if (err) {
      console.error('Error fetching inventory quantities:', err);
      return res.status(500).json({ message: 'Failed to fetch inventory quantities' });
    }

    // Map results to { productId: quantity }
    const quantities = {};
    results.forEach(row => {
      quantities[row.id] = row.quantity;
    });

    res.json(quantities);
  });
});

// API to add a new inventory item
app.post('/api/inventory', (req, res) => {
  const newItem = req.body;
  console.log('Received new inventory item:', newItem);

  const sql = 'INSERT INTO inventory SET ?';
  db.query(sql, newItem, (err, result) => {
    if (err) {
      console.error('Error inserting item:', err);
      return res.status(500).json({ error: 'Failed to add item to database' });
    }
    res.json({ message: 'Item added successfully!', id: result.insertId });
  });
});

// API to update an existing inventory item
app.put('/api/inventory/:id', (req, res) => {
  const itemId = req.params.id;
  const updatedItem = req.body;

  // Validate required fields
  if (
    !updatedItem.name ||
    !updatedItem.category ||
    updatedItem.quantity === undefined ||
    updatedItem.price === undefined ||
    !updatedItem.supplier ||
    !updatedItem.sku ||
    !updatedItem.warehouse ||
    updatedItem.weight_kg === undefined
  ) {
    return res.status(400).json({ error: 'Missing required fields for update' });
  }

  const sql = `
    UPDATE inventory
    SET name = ?, category = ?, description = ?, quantity = ?, status = ?, price = ?, supplier = ?, sku = ?, warehouse = ?, weight_kg = ?, action = ?
    WHERE id = ?
  `;

  const params = [
    updatedItem.name,
    updatedItem.category,
    updatedItem.description || '',
    updatedItem.quantity,
    updatedItem.status || 'In Stock',
    updatedItem.price,
    updatedItem.supplier,
    updatedItem.sku,
    updatedItem.warehouse,
    updatedItem.weight_kg,
    updatedItem.action || '',
    itemId
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating inventory item:', err);
      return res.status(500).json({ error: 'Failed to update item in database' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Return the updated item
    const selectSql = 'SELECT * FROM inventory WHERE id = ?';
    db.query(selectSql, [itemId], (selectErr, rows) => {
      if (selectErr) {
        console.error('Error fetching updated item:', selectErr);
        return res.status(500).json({ error: 'Failed to fetch updated item' });
      }
      res.json(rows[0]);
    });
  });
});

// User Registration API
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Hash the password before saving to the database
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Error hashing password' });
    }

    // Default role for users is "user", but you can assign "admin" based on specific conditions
    const role = email === 'jasimp412@gmail.com' ? 'admin' : 'user'; // Example: Only this email gets admin role

    // Insert user into database
    const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, email, hashedPassword, role], (err, result) => {
      if (err) {
        console.error('Error inserting user into database:', err);
        return res.status(500).json({ message: 'Error registering user' });
      }

      // Respond with success message
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// User Login API
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ message: 'Error logging in' });
    }
    if (result.length === 0) {
      console.warn('Login attempt with non-existent user:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('Invalid password attempt for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    try {
      // Create a JWT token including email
      const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, message: 'Login successful' });
    } catch (tokenErr) {
      console.error('JWT token generation error:', tokenErr);
      res.status(500).json({ message: 'Failed to generate token' });
    }
  });
});

const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

console.log("OAuth2 CLIENT_ID present:", !!process.env.CLIENT_ID);
console.log("OAuth2 CLIENT_SECRET present:", !!process.env.CLIENT_SECRET);
console.log("OAuth2 REFRESH_TOKEN present:", !!process.env.REFRESH_TOKEN);
console.log("OAuth2 EMAIL_USER present:", !!process.env.EMAIL_USER);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log('Received new refresh token:', tokens.refresh_token ? 'Yes' : 'No');
  }
  console.log('Access token:', tokens.access_token ? 'Present' : 'Absent');
});

async function sendTestEmail() {
  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REFRESH_TOKEN || !process.env.EMAIL_USER) {
    console.warn('OAuth2 credentials missing. Skipping test email sending.');
    return;
  }
  try {
    const accessToken = await oauth2Client.getAccessToken();
    console.log('Access Token:', accessToken.token);

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email from Nodemailer with OAuth2',
      text: 'This is a test email to verify SMTP settings with OAuth2.',
    };

    let info = await transporter.sendMail(mailOptions);
    console.log('Test email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

sendTestEmail();

// Forgot password routes restored

app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Check if user exists
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(400).json({ message: 'User not found' });

    // Generate OTP (6 digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiry (e.g., 10 minutes) in a separate table or in-memory store
    // For simplicity, create a table 'password_resets' with columns: email, otp, expires_at, used
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert OTP for the email, reset used flag to false
    const sqlUpsert = `
      INSERT INTO password_resets (email, otp, expires_at, used)
      VALUES (?, ?, ?, false)
      ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at), used = false
    `;

    db.query(sqlUpsert, [email, otp, expiresAt], (upsertErr) => {
      if (upsertErr) {
        console.error('Error saving OTP:', upsertErr);
        return res.status(500).json({ message: 'Failed to save OTP' });
      }

      try {
        oauth2Client.getAccessToken().then(accessToken => {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: process.env.EMAIL_USER,
              clientId: process.env.CLIENT_ID,
              clientSecret: process.env.CLIENT_SECRET,
              refreshToken: process.env.REFRESH_TOKEN,
              accessToken: accessToken.token,
            },
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Password Reset',
            text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending OTP email:', error);
              return res.status(500).json({ message: 'Failed to send OTP email' });
            } else {
              console.log('OTP email sent: ' + info.response);
              res.json({ message: 'OTP sent' });
            }
          });
        });
      } catch (error) {
        console.error('Error in OAuth2 email sending:', error);
        return res.status(500).json({ message: 'Failed to send OTP email' });
      }
    });
  });
});

app.post('/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Email, OTP, and new password are required' });

  // Check OTP validity and if it is not used
  const sqlCheckOtp = 'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = false';
  db.query(sqlCheckOtp, [email, otp], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(400).json({ message: 'Invalid, expired, or already used OTP' });

    // Hash new password
    bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
      if (hashErr) return res.status(500).json({ message: 'Error hashing password' });

      // Update user's password
      const sqlUpdate = 'UPDATE users SET password = ? WHERE email = ?';
      db.query(sqlUpdate, [hashedPassword, email], (updateErr) => {
        if (updateErr) return res.status(500).json({ message: 'Failed to update password' });

        // Mark OTP as used
        const sqlMarkUsed = 'UPDATE password_resets SET used = true WHERE email = ? AND otp = ?';
        db.query(sqlMarkUsed, [email, otp], (markErr) => {
          if (markErr) console.error('Failed to mark OTP as used:', markErr);
        });

        res.json({ message: 'Password reset successful' });
      });
    });
  });
});

// Add missing API routes for fleet, user profile, orders, shipments, users
// GET /api/fleet - Return fleet data
app.get('/api/fleet', (req, res) => {
  const sql = 'SELECT * FROM fleet';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching fleet data:', err);
      return res.status(500).json({ error: 'Failed to fetch fleet data' });
    }
    res.json(results);
  });
});

// Middleware to verify JWT and extract user ID
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    console.log('Decoded user from token:', user);
    req.user = user;
    next();
  });
}

// GET /api/user/profile - Return logged-in user profile data
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  console.log('Fetching profile for userId:', userId);
  const sql = 'SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    const user = results[0];
    // Map username to name and add default image URL
    const profile = {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
      image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' // default profile image
    };
    res.json(profile);
  });
});

// GET /api/user/address - Return logged-in user address data
app.get('/api/user/address', authenticateToken, (req, res) => {
  const userId = req.user.id;
  console.log('Fetching addresses for userId:', userId);
  // Assuming there is an addresses table with user_id foreign key
  const sql = 'SELECT * FROM addresses WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user addresses:', err);
      return res.status(500).json({ error: 'Failed to fetch user addresses' });
    }
    res.json(results);
  });
});

// POST /api/user/address - Add a new address for logged-in user
app.post('/api/user/address', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { fullname, phone, email, pincode, state, city, house, road } = req.body;
  if (!fullname || !phone || !pincode || !state || !city) {
    return res.status(400).json({ message: 'Missing required address fields' });
  }
  const sql = `
    INSERT INTO addresses (user_id, fullname, phone, email, pincode, state, city, house, road)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [userId, fullname, phone, email, pincode, state, city, house || '', road || ''], (err, result) => {
    if (err) {
      console.error('Error adding user address:', err);
      return res.status(500).json({ message: 'Failed to add address' });
    }
    res.json({ message: 'Address added successfully', id: result.insertId });
  });
});

// PUT /api/user/address - Update an existing address for logged-in user
app.put('/api/user/address', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { id, fullname, phone, email, pincode, state, city, house, road } = req.body;
  if (!id || !fullname || !phone || !pincode || !state || !city) {
    return res.status(400).json({ message: 'Missing required address fields or id' });
  }
  const sql = `
    UPDATE addresses
    SET fullname = ?, phone = ?, email = ?, pincode = ?, state = ?, city = ?, house = ?, road = ?
    WHERE id = ? AND user_id = ?
  `;
  db.query(sql, [fullname, phone, email, pincode, state, city, house || '', road || '', id, userId], (err, result) => {
    if (err) {
      console.error('Error updating user address:', err);
      return res.status(500).json({ message: 'Failed to update address' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found or not owned by user' });
    }
    res.json({ message: 'Address updated successfully' });
  });
});

// 🔁 Shared status mapping function
function mapShipmentToOrderStatus(shipmentStatus) {
  switch (shipmentStatus.toLowerCase()) {
    case 'added to shipment': return 'Shipped';
    case 'in transit': return 'Processing';
    case 'delayed': return 'Pending';
    case 'delivered': return 'Delivered';
    default: return null;
  }
}

// 🚚 Add a new shipment + update order status
app.post('/api/shipments', (req, res) => {
  const {
    shipmentId, orderId, carrier, trackingNumber,
    status, shipmentDate, estimatedDelivery,
    fromLocation, toLocation, customerName
  } = req.body;

  if (!shipmentId || !orderId || !carrier || !trackingNumber ||
      !status || !shipmentDate || !estimatedDelivery ||
      !fromLocation || !toLocation || !customerName) {
    return res.status(400).json({ message: 'Missing required shipment fields' });
  }

  const checkQuery = 'SELECT shipmentId FROM shipments WHERE shipmentId = ?';
  db.query(checkQuery, [shipmentId], (checkErr, checkResult) => {
    if (checkErr) return res.status(500).json({ message: 'Server Error', error: checkErr.message });
    if (checkResult.length > 0) return res.status(400).json({ message: 'Duplicate shipmentId' });

    const insertQuery = `
      INSERT INTO shipments (shipmentId, orderId, carrier, trackingNumber, status, shipmentDate, estimatedDelivery, fromLocation, toLocation, customerName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(insertQuery, [
      shipmentId, orderId, carrier, trackingNumber,
      status, shipmentDate, estimatedDelivery,
      fromLocation, toLocation, customerName
    ], (err, result) => {
      if (err) return res.status(500).json({ message: 'Server Error', error: err.message });

      const orderStatus = mapShipmentToOrderStatus(status);
      if (orderStatus) {
        const updateOrder = 'UPDATE orders SET orderStatus = ? WHERE order_id = ?';
        db.query(updateOrder, [orderStatus, orderId], err2 => {
          if (err2) console.error('Error updating order status:', err2);
        });
      }

      res.json({ message: 'Shipment added and order status updated (if applicable)' });
    });
  });
});

// 🚚 Update shipment status + update order status
app.put('/api/shipments/:shipmentId', (req, res) => {
 
  const { shipmentId } = req.params;
  const { status } = req.body;
  console.log("wotking",shipmentId, status)
  const updateShipmentQuery = 'UPDATE shipments SET status = ? WHERE orderId = ?';
  db.query(updateShipmentQuery, [status, shipmentId], (err, result) => {
    if (err) return res.status(500).send('Server Error');

    const getOrderIdQuery = 'SELECT orderId FROM shipments WHERE orderId = ?';
    db.query(getOrderIdQuery, [shipmentId], (err2, results) => {
      if (err2) return res.status(500).send('Server Error');
      if (results.length === 0) return res.status(404).json({ message: 'Shipment not found' });

      const orderId = results[0].orderId;
      const orderStatus = mapShipmentToOrderStatus(status);

      if (orderStatus) {
        const updateOrder = 'UPDATE orders SET order_status = ? WHERE order_id = ?';
        db.query(updateOrder, [orderStatus, orderId], err3 => {
          if (err3) return res.status(500).send('Server Error');
          res.json({ message: 'Shipment and order status updated successfully' });
        });
      } else {
        res.json({ message: 'Shipment status updated successfully, no order status change' });
      }
    });
  });
});

// 📦 Get all shipments
app.get('/api/shipments', (req, res) => {
  db.query('SELECT * FROM shipments ORDER BY shipmentDate DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch shipments' });
    res.json(results);
  });
});

// 📦 Get shipments by status
app.get('/api/shipments/status/:status', (req, res) => {
  db.query('SELECT * FROM shipments WHERE status = ?', [req.params.status], (err, results) => {
    if (err) return res.status(500).send('Server Error');
    res.json(results);
  });
});

app.get('/api/orders', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });

    const userId = decoded.id;
    const role = decoded.role;
    const sql = role === 'admin'
      ? 'SELECT * FROM orders ORDER BY date DESC'
      : 'SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC';
    const params = role === 'admin' ? [] : [userId];

    db.query(sql, params, (err, orders) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch orders' });
      if (!orders.length) return res.json([]);

      const sqlProducts = 'SELECT * FROM order_products WHERE order_id = ?';
      let completed = 0;
      orders.forEach((order, index) => {
        db.query(sqlProducts, [order.id], (err2, products) => {
          if (err2) return res.status(500).json({ message: 'Failed to fetch order products' });

          orders[index].products = Array.isArray(products) ? products : [];

          // Parse delivery_address string to JSON object and map fields to frontend expected keys
          try {
            const addr = JSON.parse(orders[index].delivery_address);
            orders[index].delivery_address = {
              name: addr.fullname || '',
              address: [addr.house, addr.road].filter(Boolean).join(', '),
              address2: '',
              city: addr.city || '',
              state: addr.state || '',
              zip: addr.pincode || '',
              phone: addr.phone || '',
              email: addr.email || ''
            };
          } catch (parseErr) {
            // If parsing fails, keep as string
            orders[index].delivery_address = orders[index].delivery_address || {};
          }

          completed++;
          if (completed === orders.length) res.json(orders);
        });
      });
    });
  });
});
// API to save order
app.post('/api/orders', (req, res) => {
  console.log('Received order POST request with body:', req.body);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const userId = decoded.id;
    const { orderId, products, deliveryAddress, date, price, paymentMethod, gst, total } = req.body;
    if (
      orderId === undefined || orderId === null ||
      products === undefined || products === null ||
      deliveryAddress === undefined || deliveryAddress === null ||
      date === undefined || date === null ||
      price === undefined || price === null ||
      paymentMethod === undefined || paymentMethod === null ||
      gst === undefined || gst === null ||
      total === undefined || total === null
    ) {
      console.log('Missing order fields:', { orderId, products, deliveryAddress, date, price, paymentMethod, gst, total });
      return res.status(400).json({ message: 'Missing order fields' });
    }
    // Store deliveryAddress as JSON string
    const deliveryAddressString = typeof deliveryAddress === 'string' ? deliveryAddress : JSON.stringify(deliveryAddress);

    // Insert order into orders table
    const sqlOrder = 'INSERT INTO orders (user_id, order_id, delivery_address, date, price, payment_method, gst, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sqlOrder, [userId, orderId, deliveryAddressString, date, price, paymentMethod, gst, total], (err, result) => {
      if (err) {
        console.error('Error inserting order:', err);
        console.error('Order data causing error:', { userId, orderId, deliveryAddress, date, price, paymentMethod, gst, total });
        return res.status(500).json({ message: 'Failed to save order', error: err.message });
      }
      const insertedOrderId = result.insertId;
      // Insert products into order_products table
      const sqlProduct = 'INSERT INTO order_products (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)';
      // Insert products one by one to avoid issues with bulk insert
      const insertProduct = (index) => {
        if (index >= products.length) {
          return res.json({ message: 'Order saved successfully' });
        }
        const p = products[index];
        db.query(sqlProduct, [insertedOrderId, p.id, p.name, p.quantity, p.price], (err2) => {
          if (err2) {
            console.error('Error inserting order product:', err2);
            return res.status(500).json({ message: 'Failed to save order products', error: err2.message });
          }
          insertProduct(index + 1);
        });
      };
      insertProduct(0);
    });
  });
});


// ✅ Optional Admin Manual Order Status Update
app.put('/api/orders/:id/status', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const orderId = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const sql = 'UPDATE orders SET orderStatus = ? WHERE id = ?';
    db.query(sql, [status, orderId], (err3, updateResult) => {
      if (err3) {
        console.error('Error updating order status:', err3.sqlMessage || err3);
        return res.status(500).json({ message: 'Failed to update order status', error: err3.sqlMessage || err3 });
      }
      if (updateResult.affectedRows === 0) {
        console.error('No order found with order_id:', orderId);
        return res.status(404).json({ message: 'Order not found' });
      }
      return res.json({ message: 'Shipment and order status updated successfully' });
    });
    
  });
});

 // New API endpoint for customers to cancel their own orders
  app.put('/api/orders/:id/cancel', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Invalid token' });

      const userId = decoded.id;
      const orderId = req.params.id;

      console.log(`Cancel request for orderId: ${orderId} by userId: ${userId}`);

      // Check if the order belongs to the user
      const checkOrderSql = 'SELECT * FROM orders WHERE order_id = ? AND user_id = ?';
      db.query(checkOrderSql, [orderId, userId], (checkErr, results) => {
        if (checkErr) {
          console.error('Error checking order ownership:', checkErr);
          return res.status(500).json({ message: 'Server error' });
        }
        if (results.length === 0) {
          console.warn(`User ${userId} tried to cancel order ${orderId} without permission`);
          return res.status(403).json({ message: 'You do not have permission to cancel this order' });
        }

        // Update order status to 'Cancelled'
        const updateSql = 'UPDATE orders SET order_status = ? WHERE order_id = ?';
        db.query(updateSql, ['Cancelled', orderId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error('Error updating order status:', updateErr);
            return res.status(500).json({ message: 'Failed to update order status' });
          }
          if (updateResult.affectedRows === 0) {
            console.warn(`Order ${orderId} not found during cancellation`);
            return res.status(404).json({ message: 'Order not found' });
          }
          console.log(`Order ${orderId} cancelled successfully`);
          return res.json({ message: 'Order cancelled successfully' });
        });
      });
    });
  });

// GET /api/users - Return users data
app.get('/api/users', (req, res) => {
  const sql = 'SELECT id, username, email, role FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users data:', err);
      return res.status(500).json({ error: 'Failed to fetch users data' });
    }
    res.json(results);
  });
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
