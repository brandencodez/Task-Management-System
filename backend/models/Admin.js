const db = require('../config/database');
const bcrypt = require('bcrypt');

class Admin {

  // ✅ Create Admin
 static async create(adminData) {
  const { full_name, email, password } = adminData;

  if (!full_name || !email || !password) {
    const error = new Error('Missing required fields');
    error.statusCode = 400;
    throw error;
  }

  const [existingAdmin] = await db.execute(
    'SELECT id FROM admins WHERE LOWER(email) = LOWER(?)',
    [email]
  );

  if (existingAdmin.length > 0) {
    const error = new Error('An admin with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [result] = await db.execute(
    `INSERT INTO admins (full_name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?)`,
    [full_name, email, password_hash, 'admin', 'active']
  );

  return {
    id: result.insertId,
    full_name,
    email,
    role: 'admin',
    status: 'active'
  };
}


  // ✅ Find admin by email (for login)
  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email]
    );
    return rows[0];
  }

  // ✅ Find admin by ID
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, full_name, email, role, status, created_at FROM admins WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // ✅ Get all admins
  static async findAll() {
    const [rows] = await db.execute(
      'SELECT id, full_name, email, role, status, created_at FROM admins ORDER BY id'
    );
    return rows;
  }

  // ✅ Update admin profile
  static async update(id, adminData) {
    const { full_name, email, status } = adminData;

    // Check duplicate email (exclude self)
    const [existingEmail] = await db.execute(
      'SELECT id FROM admins WHERE LOWER(email) = LOWER(?) AND id != ?',
      [email, id]
    );

    if (existingEmail.length > 0) {
      throw new Error('An admin with this email already exists');
    }

    const query = `
      UPDATE admins
      SET full_name = ?, email = ?, status = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      full_name,
      email,
      status,
      id
    ]);

    return { id, full_name, email, status };
  }

  // ✅ Update password
  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);

    await db.execute(
      'UPDATE admins SET password_hash = ? WHERE id = ?',
      [password_hash, id]
    );
  }

  // ✅ Delete admin
  static async delete(id) {
    await db.execute(
      'DELETE FROM admins WHERE id = ?',
      [id]
    );
  }
}

module.exports = Admin;
