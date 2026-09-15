const wishlistModel = require('../models/wishlistModel');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const items = await wishlistModel.getByUser(req.user.id);
  res.json({ success: true, data: { items } });
});

// POST /api/wishlist  { productId }
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    res.statusCode = 400;
    throw new Error('productId is required');
  }

  await wishlistModel.add(req.user.id, productId);
  const items = await wishlistModel.getByUser(req.user.id);
  res.status(201).json({ success: true, message: 'Added to wishlist', data: { items } });
});

// DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const removed = await wishlistModel.remove(req.user.id, req.params.productId);
  if (!removed) {
    res.statusCode = 404;
    throw new Error('Item not found in wishlist');
  }
  const items = await wishlistModel.getByUser(req.user.id);
  res.json({ success: true, message: 'Removed from wishlist', data: { items } });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
