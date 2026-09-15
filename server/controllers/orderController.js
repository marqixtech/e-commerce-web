const orderModel = require('../models/orderModel');
const { asyncHandler } = require('../middleware/errorHandler');

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// POST /api/orders/checkout
// { shippingName, shippingPhone, shippingAddress, paymentMethod }
const checkout = asyncHandler(async (req, res) => {
  const { shippingName, shippingPhone, shippingAddress, paymentMethod } = req.body;

  if (!shippingName || !shippingPhone || !shippingAddress) {
    res.statusCode = 400;
    throw new Error('shippingName, shippingPhone and shippingAddress are required');
  }

  const order = await orderModel.createFromCart(req.user.id, {
    shippingName,
    shippingPhone,
    shippingAddress,
    paymentMethod,
  });

  const items = await orderModel.getItems(order.id);

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order, items },
  });
});

// GET /api/orders  — current user's order history
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderModel.findByUser(req.user.id);
  res.json({ success: true, data: { orders } });
});

// GET /api/orders/:id  — order detail + items + status timeline (tracking)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderModel.findById(req.params.id);

  if (!order) {
    res.statusCode = 404;
    throw new Error('Order not found');
  }

  // Customers can only view their own orders; admins can view any
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    res.statusCode = 403;
    throw new Error('You do not have access to this order');
  }

  const [items, statusHistory] = await Promise.all([
    orderModel.getItems(order.id),
    orderModel.getStatusHistory(order.id),
  ]);

  res.json({ success: true, data: { order, items, statusHistory } });
});

// PUT /api/orders/:id/status  (admin only)  { status, note }
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    res.statusCode = 400;
    throw new Error(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const order = await orderModel.updateStatus(req.params.id, status, note);
  if (!order) {
    res.statusCode = 404;
    throw new Error('Order not found');
  }

  res.json({ success: true, message: 'Order status updated', data: { order } });
});

module.exports = { checkout, getMyOrders, getOrderById, updateOrderStatus };
