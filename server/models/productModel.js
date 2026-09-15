const db = require('../config/db');

const productModel = {
  // List products with optional search, category filter, and pagination
  async findAll({ search, categorySlug, page = 1, limit = 20, sort } = {}) {
    const values = [];
    const conditions = [];

    let baseQuery = `
      select p.*, c.name as category_name, c.slug as category_slug,
        coalesce(avg(r.rating), 0)::numeric(2,1) as avg_rating,
        count(distinct r.id)::int as review_count
      from products p
      left join categories c on c.id = p.category_id
      left join reviews r on r.product_id = p.id
    `;

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`p.name ilike $${values.length}`);
    }

    if (categorySlug) {
      values.push(categorySlug);
      conditions.push(`c.slug = $${values.length}`);
    }

    if (conditions.length) {
      baseQuery += ' where ' + conditions.join(' and ');
    }

    baseQuery += ' group by p.id, c.name, c.slug';

    const sortOptions = {
      price_asc: 'p.price asc',
      price_desc: 'p.price desc',
      newest: 'p.created_at desc',
      rating: 'avg_rating desc',
    };
    baseQuery += ` order by ${sortOptions[sort] || 'p.created_at desc'}`;

    const offset = (Math.max(page, 1) - 1) * limit;
    values.push(limit, offset);
    baseQuery += ` limit $${values.length - 1} offset $${values.length}`;

    const { rows } = await db.query(baseQuery, values);
    return rows;
  },

  async count({ search, categorySlug } = {}) {
    const values = [];
    const conditions = [];
    let query = `select count(distinct p.id)::int as total from products p
      left join categories c on c.id = p.category_id`;

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`p.name ilike $${values.length}`);
    }
    if (categorySlug) {
      values.push(categorySlug);
      conditions.push(`c.slug = $${values.length}`);
    }
    if (conditions.length) query += ' where ' + conditions.join(' and ');

    const { rows } = await db.query(query, values);
    return rows[0].total;
  },

  async findById(id) {
    const { rows } = await db.query(
      `select p.*, c.name as category_name, c.slug as category_slug,
        coalesce(avg(r.rating), 0)::numeric(2,1) as avg_rating,
        count(distinct r.id)::int as review_count
       from products p
       left join categories c on c.id = p.category_id
       left join reviews r on r.product_id = p.id
       where p.id = $1
       group by p.id, c.name, c.slug`,
      [id]
    );
    return rows[0];
  },

  async getImages(productId) {
    const { rows } = await db.query(
      'select id, image_url, sort_order from product_images where product_id = $1 order by sort_order asc',
      [productId]
    );
    return rows;
  },

  async getRelated(productId, categoryId, limit = 4) {
    const { rows } = await db.query(
      `select id, name, price, stock from products
       where category_id = $1 and id != $2
       order by created_at desc
       limit $3`,
      [categoryId, productId, limit]
    );
    return rows;
  },

  async getFeatured(limit = 8) {
    const { rows } = await db.query(
      'select * from products where is_featured = true order by created_at desc limit $1',
      [limit]
    );
    return rows;
  },

  async getDeals(limit = 8) {
    const { rows } = await db.query(
      'select * from products where is_deal = true order by discount_pct desc limit $1',
      [limit]
    );
    return rows;
  },
};

module.exports = productModel;
