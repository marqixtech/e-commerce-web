const express = require('express');
const router = express.Router({ mergeParams: true }); // needed to access :productId from the parent mount path
const { protect } = require('../middleware/authMiddleware');
const {
  getProductReviews,
  submitReview,
  deleteReview,
} = require('../controllers/reviewController');

router.get('/', getProductReviews); // public — anyone can read reviews
router.post('/', protect, submitReview); // must be logged in to review
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
