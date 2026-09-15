const reviewModel = require('../models/reviewModel');
const productModel = require('../models/productModel');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/products/:productId/reviews  (public)
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewModel.findByProduct(req.params.productId);
  res.json({ success: true, data: { reviews } });
});

// POST /api/products/:productId/reviews  (logged in)  { rating, comment }
// Submitting again updates your existing review rather than creating a duplicate.
const submitReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const ratingNum = parseInt(rating, 10);

  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    res.statusCode = 400;
    throw new Error('rating must be a whole number between 1 and 5');
  }

  const product = await productModel.findById(productId);
  if (!product) {
    res.statusCode = 404;
    throw new Error('Product not found');
  }

  const review = await reviewModel.upsert(req.user.id, productId, ratingNum, comment);

  res.status(201).json({
    success: true,
    message: 'Review submitted',
    data: { review },
  });
});

// DELETE /api/products/:productId/reviews/:reviewId  (own review only)
const deleteReview = asyncHandler(async (req, res) => {
  const removed = await reviewModel.remove(req.user.id, req.params.reviewId);
  if (!removed) {
    res.statusCode = 404;
    throw new Error('Review not found or you do not have permission to delete it');
  }
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { getProductReviews, submitReview, deleteReview };
