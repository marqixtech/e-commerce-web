const db = require('../config/db');

const orderModel = {
  // Runs the whole checkout as one DB transaction:
  // create order -> snapshot cart items into order_items -> decrement stock
  // -> log initial status -> clear cart
  async createFromCart(userId, { shippingName, shippingPhone, shippingAddress, paymentMethod }) {
    const client = await db.pool.connect();
    try {
      await client.query('begin');

      const cartResult = await client.query(
        `select ci.product_id, ci.quantity, p.name, p.price, p.stock, p.discount_pct
         from cart_items ci
         join products p on p.id = ci.product_id
         where ci.user_id = $1
         for update of p`, // lock the product rows so stock can't race
        [userId]
      );
      const cartItems = cartResult.rows;

      if (cartItems.length === 0) {
        const err = new Error('Your cart is empty');
        err.statusCode = 400;
        throw err;
      }

      // Validate stock for every item before committing anything
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          const err = new Error(`Not enough stock for "${item.name}" (only ${item.stock} left)`);
          err.statusCode = 400;
          throw err;
        }
      }

      let totalAmount = 0;
      const lineItems = cartItems.map((item) => {
        const unitPrice = item.discount_pct
          ? +(item.price * (1 - item.discount_pct / 100)).toFixed(2)
          : +item.price;
        const lineTotal = +(unitPrice * item.quantity).toFixed(2);
        totalAmount += lineTotal;
        return { ...item, unitPrice, lineTotal };
      });
      totalAmount = +totalAmount.toFixed(2);

      const orderResult = await client.query(
        `insert into orders (user_id, status, total_amount, shipping_name, shipping_phone, shipping_address, payment_method, payment_status)
         values ($1, 'pending', $2, $3, $4, $5, $6, 'unpaid')
         returning *`,
        [userId, totalAmount, shippingName, shippingPhone, shippingAddress, paymentMethod || 'not_set']
      );
      const order = orderResult.rows[0];

      for (const item of lineItems) {
        await client.query(
          `insert into order_items (order_id, product_id, product_name, unit_price, quantity)
           values ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.name, item.unitPrice, item.quantity]
        );

        await client.query(
          'update products set stock = stock - $1 where id = $2',
          [item.quantity, item.product_id]
        );
      }

      await client.query(
        `insert into order_status_history (order_id, status, note) values ($1, 'pending', 'Order placed')`,
        [order.id]
      );

      await client.query('delete from cart_items where user_id = $1', [userId]);

      await client.query('commit');
      return order;
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  },

  async findByUser(userId) {
    const { rows } = await db.query(
      'select * from orders where user_id = $1 order by created_at desc',
      [userId]
    );
    return rows;
  },

  async findById(orderId) {
    const { rows } = await db.query('select * from orders where id = $1', [orderId]);
    return rows[0];
  },

  async getItems(orderId) {
    const { rows } = await db.query(
      'select * from order_items where order_id = $1',
      [orderId]
    );
    return rows;
  },

  async getStatusHistory(orderId) {
    const { rows } = await db.query(
      'select status, note, created_at from order_status_history where order_id = $1 order by created_at asc',
      [orderId]
    );
    return rows;
  },

  async updateStatus(orderId, status, note) {
    const { rows } = await db.query(
      `update orders set status = $2 where id = $1 returning *`,
      [orderId, status]
    );
    if (rows[0]) {
      await db.query(
        'insert into order_status_history (order_id, status, note) values ($1, $2, $3)',
        [orderId, status, note || null]
      );
    }
    return rows[0];
  },
};

module.exports = orderModel;
