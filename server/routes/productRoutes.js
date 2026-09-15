const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeatured,
  getDeals,
  getProductById,
  getCategories,
} = require('../controllers/productController');

// IMPORTANT: specific routes must be declared before the /:id catch-all route,
// otherwise "featured"/"deals"/"categories" would be parsed as an :id value.
router.get('/featured', getFeatured);
router.get('/deals', getDeals);
router.get('/categories/all', getCategories);

router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;
