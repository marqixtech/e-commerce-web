const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  checkout,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');

router.use(protect); // every order route requires a logged-in user

router.post('/checkout', checkout);
router.get('/admin/all', requireRole('admin'), getAllOrders); // must come before /:id
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', requireRole('admin'), updateOrderStatus);

module.exports = router;
