const db = require('../config/db');

const cartModel = {
  async getByUser(userId) {
    const { rows } = await db.query(
      `select ci.id as cart_item_id, ci.quantity, ci.created_at,
              p.id as product_id, p.name, p.price, p.stock, p.discount_pct
       from cart_items ci
       join products p on p.id = ci.product_id
       where ci.user_id = $1
       order by ci.created_at desc`,
      [userId]
    );
    return rows;
  },

  // Adds the product, or increments quantity if it's already in the cart
  async addOrIncrement(userId, productId, quantity) {
    const { rows } = await db.query(
      `insert into cart_items (user_id, product_id, quantity)
       values ($1, $2, $3)
       on conflict (user_id, product_id)
       do update set quantity = cart_items.quantity + excluded.quantity
       returning *`,
      [userId, productId, quantity]
    );
    return rows[0];
  },

  async updateQuantity(userId, productId, quantity) {
    const { rows } = await db.query(
      `update cart_items set quantity = $3
       where user_id = $1 and product_id = $2
       returning *`,
      [userId, productId, quantity]
    );
    return rows[0];
  },

  async remove(userId, productId) {
    const { rows } = await db.query(
      'delete from cart_items where user_id = $1 and product_id = $2 returning *',
      [userId, productId]
    );
    return rows[0];
  },

  async clear(userId) {
    await db.query('delete from cart_items where user_id = $1', [userId]);
  },

  async findProductStock(productId) {
    const { rows } = await db.query('select stock from products where id = $1', [productId]);
    return rows[0];
  },
};

module.exports = cartModel;
