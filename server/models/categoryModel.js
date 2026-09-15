const db = require('../config/db');

const categoryModel = {
  async findAll() {
    const { rows } = await db.query(
      'select id, name, slug from categories order by name asc'
    );
    return rows;
  },

  async findBySlug(slug) {
    const { rows } = await db.query(
      'select id, name, slug from categories where slug = $1',
      [slug]
    );
    return rows[0];
  },
};

module.exports = categoryModel;
