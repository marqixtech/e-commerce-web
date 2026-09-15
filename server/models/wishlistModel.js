const db = require('../config/db');

const wishlistModel = {
  async getByUser(userId) {
    const { rows } = await db.query(
      `select wi.id as wishlist_item_id, wi.created_at,
              p.id as product_id, p.name, p.price, p.stock
       from wishlist_items wi
       join products p on p.id = wi.product_id
       where wi.user_id = $1
       order by wi.created_at desc`,
      [userId]
    );
    return rows;
  },

  async add(userId, productId) {
    const { rows } = await db.query(
      `insert into wishlist_items (user_id, product_id)
       values ($1, $2)
       on conflict (user_id, product_id) do nothing
       returning *`,
      [userId, productId]
    );
    return rows[0]; // undefined if it already existed — controller treats that as fine
  },

  async remove(userId, productId) {
    const { rows } = await db.query(
      'delete from wishlist_items where user_id = $1 and product_id = $2 returning *',
      [userId, productId]
    );
    return rows[0];
  },
};

module.exports = wishlistModel;
