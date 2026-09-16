const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getProducts,
  getFeatured,
  getDeals,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// IMPORTANT: specific routes must be declared before the /:id catch-all route,
// otherwise "featured"/"deals"/"categories" would be parsed as an :id value.
router.get('/featured', getFeatured);
router.get('/deals', getDeals);
router.get('/categories/all', getCategories);

router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only — product management
router.post('/', protect, requireRole('admin'), createProduct);
router.put('/:id', protect, requireRole('admin'), updateProduct);
router.delete('/:id', protect, requireRole('admin'), deleteProduct);

module.exports = router;
