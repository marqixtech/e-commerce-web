require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Core middleware ----
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MARQIX SHOPPING MALL API is running' });
});

// ---- Routes (added stage by stage) ----
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/products/:productId/reviews', require('./routes/reviewRoutes'));

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Central error handler (must be last) ----
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
