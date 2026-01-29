const db = require('../config/database');

class Employee {
  static async create(employeeData) {
    const { 
      name, email, phone, department, position, 
      join_date, home_address, status, issued_items, password_hash 
    } = employeeData;
    
    const query = `
      INSERT INTO employees 
      (name, email, phone, department, position, join_date, home_address, status, issued_items, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      name, email, phone, department, position, 
      join_date, home_address, status, issued_items, password_hash
    ]);
    
    return { id: result.insertId, ...employeeData };
  }

  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM employees ORDER BY id');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM employees WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, employeeData) {
    const { 
      name, email, phone, department, position, 
      join_date, home_address, status, issued_items, password_hash 
    } = employeeData;
    
    const query = `
      UPDATE employees 
      SET name = ?, email = ?, phone = ?, department = ?, position = ?, 
          join_date = ?, home_address = ?, status = ?, issued_items = ?, password_hash = ?
      WHERE id = ?
    `;
    
    await db.execute(query, [
      name, email, phone, department, position, 
      join_date, home_address, status, issued_items, password_hash, id
    ]);
    
    return { id, ...employeeData };
  }

  static async delete(id) {
    await db.execute('DELETE FROM employees WHERE id = ?', [id]);
  }

  static async findByName(name) {
    const [rows] = await db.execute('SELECT * FROM employees WHERE name LIKE ?', [`%${name}%`]);
    return rows;
  }
}

module.exports = Employee;