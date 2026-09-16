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

// ---------- Admin only ----------

// POST /api/products  (admin only)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, categoryId, brand, isFeatured, isDeal, discountPct, imageUrl } = req.body;

  if (!name || price === undefined) {
    res.statusCode = 400;
    throw new Error('name and price are required');
  }

  const product = await productModel.create({
    name, description, price, stock, categoryId, brand, isFeatured, isDeal, discountPct,
  });

  if (imageUrl) {
    await productModel.addImage(product.id, imageUrl, 0);
  }

  res.status(201).json({ success: true, message: 'Product created', data: { product } });
});

// PUT /api/products/:id  (admin only)
const updateProduct = asyncHandler(async (req, res) => {
  const existing = await productModel.findById(req.params.id);
  if (!existing) {
    res.statusCode = 404;
    throw new Error('Product not found');
  }

  const { categoryId, isFeatured, isDeal, discountPct, ...rest } = req.body;
  const fields = { ...rest };
  if (categoryId !== undefined) fields.category_id = categoryId;
  if (isFeatured !== undefined) fields.is_featured = isFeatured;
  if (isDeal !== undefined) fields.is_deal = isDeal;
  if (discountPct !== undefined) fields.discount_pct = discountPct;

  const product = await productModel.update(req.params.id, fields);
  res.json({ success: true, message: 'Product updated', data: { product } });
});

// DELETE /api/products/:id  (admin only)
const deleteProduct = asyncHandler(async (req, res) => {
  const deleted = await productModel.remove(req.params.id);
  if (!deleted) {
    res.statusCode = 404;
    throw new Error('Product not found');
  }
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = {
  getProducts,
  getFeatured,
  getDeals,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
};
