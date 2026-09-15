const db = require('../config/db');

const userModel = {
  async findByEmail(email) {
    const { rows } = await db.query(
      'select * from users where email = $1',
      [email]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await db.query(
      'select id, full_name, email, role, phone, created_at from users where id = $1',
      [id]
    );
    return rows[0];
  },

  async create({ fullName, email, passwordHash, phone }) {
    const { rows } = await db.query(
      `insert into users (full_name, email, password_hash, phone)
       values ($1, $2, $3, $4)
       returning id, full_name, email, role, phone, created_at`,
      [fullName, email, passwordHash, phone || null]
    );
    return rows[0];
  },
};

module.exports = userModel;
