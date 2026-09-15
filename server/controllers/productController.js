const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/products?search=&category=&page=&limit=&sort=
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, page, limit, sort } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 50); // cap at 50 per page

  const [products, total] = await Promise.all([
    productModel.findAll({ search, categorySlug: category, page: pageNum, limit: limitNum, sort }),
    productModel.count({ search, categorySlug: category }),
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
});

// GET /api/products/featured
const getFeatured = asyncHandler(async (req, res) => {
  const products = await productModel.getFeatured();
  res.json({ success: true, data: { products } });
});

// GET /api/products/deals
const getDeals = asyncHandler(async (req, res) => {
  const products = await productModel.getDeals();
  res.json({ success: true, data: { products } });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await productModel.findById(req.params.id);
  if (!product) {
    res.statusCode = 404;
    throw new Error('Product not found');
  }

  const [images, related] = await Promise.all([
    productModel.getImages(product.id),
    productModel.getRelated(product.id, product.category_id),
  ]);

  res.json({ success: true, data: { product, images, related } });
});

// GET /api/products/categories/all
const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryModel.findAll();
  res.json({ success: true, data: { categories } });
});

module.exports = { getProducts, getFeatured, getDeals, getProductById, getCategories };
