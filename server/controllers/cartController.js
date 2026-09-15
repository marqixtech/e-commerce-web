const cartModel = require('../models/cartModel');
const { asyncHandler } = require('../middleware/errorHandler');

function buildCartSummary(items) {
  const enriched = items.map((item) => {
    const discountedPrice = item.discount_pct
      ? +(item.price * (1 - item.discount_pct / 100)).toFixed(2)
      : +item.price;
    return {
      ...item,
      unit_price: discountedPrice,
      line_total: +(discountedPrice * item.quantity).toFixed(2),
    };
  });

  const totalItems = enriched.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = +enriched.reduce((sum, i) => sum + i.line_total, 0).toFixed(2);

  return { items: enriched, totalItems, totalPrice };
}

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const items = await cartModel.getByUser(req.user.id);
  res.json({ success: true, data: buildCartSummary(items) });
});

// POST /api/cart  { productId, quantity }
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10) || 1;

  if (!productId) {
    res.statusCode = 400;
    throw new Error('productId is required');
  }
  if (qty < 1) {
    res.statusCode = 400;
    throw new Error('quantity must be at least 1');
  }

  const product = await cartModel.findProductStock(productId);
  if (!product) {
    res.statusCode = 404;
    throw new Error('Product not found');
  }
  if (product.stock < qty) {
    res.statusCode = 400;
    throw new Error(`Only ${product.stock} unit(s) left in stock`);
  }

  await cartModel.addOrIncrement(req.user.id, productId, qty);
  const items = await cartModel.getByUser(req.user.id);
  res.status(201).json({ success: true, message: 'Added to cart', data: buildCartSummary(items) });
});

// PUT /api/cart/:productId  { quantity }
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  if (!qty || qty < 1) {
    res.statusCode = 400;
    throw new Error('quantity must be at least 1 (use DELETE to remove an item)');
  }

  const product = await cartModel.findProductStock(productId);
  if (!product) {
    res.statusCode = 404;
    throw new Error('Product not found');
  }
  if (product.stock < qty) {
    res.statusCode = 400;
    throw new Error(`Only ${product.stock} unit(s) left in stock`);
  }

  const updated = await cartModel.updateQuantity(req.user.id, productId, qty);
  if (!updated) {
    res.statusCode = 404;
    throw new Error('Item not found in cart');
  }

  const items = await cartModel.getByUser(req.user.id);
  res.json({ success: true, message: 'Cart updated', data: buildCartSummary(items) });
});

// DELETE /api/cart/:productId
const removeFromCart = asyncHandler(async (req, res) => {
  const removed = await cartModel.remove(req.user.id, req.params.productId);
  if (!removed) {
    res.statusCode = 404;
    throw new Error('Item not found in cart');
  }
  const items = await cartModel.getByUser(req.user.id);
  res.json({ success: true, message: 'Removed from cart', data: buildCartSummary(items) });
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  await cartModel.clear(req.user.id);
  res.json({ success: true, message: 'Cart cleared', data: { items: [], totalItems: 0, totalPrice: 0 } });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
