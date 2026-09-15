const db = require('../config/db');

const reviewModel = {
  async findByProduct(productId) {
    const { rows } = await db.query(
      `select r.id, r.rating, r.comment, r.created_at,
              u.id as user_id, u.full_name as reviewer_name
       from reviews r
       join users u on u.id = r.user_id
       where r.product_id = $1
       order by r.created_at desc`,
      [productId]
    );
    return rows;
  },

  // One review per user per product — if they've already reviewed it,
  // resubmitting updates their existing review instead of creating a duplicate.
  async upsert(userId, productId, rating, comment) {
    const { rows } = await db.query(
      `insert into reviews (product_id, user_id, rating, comment)
       values ($1, $2, $3, $4)
       on conflict (product_id, user_id)
       do update set rating = excluded.rating, comment = excluded.comment
       returning *`,
      [productId, userId, rating, comment || null]
    );
    return rows[0];
  },

  async findOwn(userId, productId) {
    const { rows } = await db.query(
      'select * from reviews where user_id = $1 and product_id = $2',
      [userId, productId]
    );
    return rows[0];
  },

  async remove(userId, reviewId) {
    const { rows } = await db.query(
      'delete from reviews where id = $1 and user_id = $2 returning *',
      [reviewId, userId]
    );
    return rows[0];
  },

  // Verifies the user actually purchased this product (via a delivered/any order)
  // before allowing a review — set VERIFIED_PURCHASE_ONLY in the controller to enable.
  async hasPurchased(userId, productId) {
    const { rows } = await db.query(
      `select 1 from order_items oi
       join orders o on o.id = oi.order_id
       where o.user_id = $1 and oi.product_id = $2
       limit 1`,
      [userId, productId]
    );
    return rows.length > 0;
  },
};

module.exports = reviewModel;
