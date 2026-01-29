const db = require('../config/database');

class Employee {
  static async create(employeeData) {
    console.log('🔍 Received employee data:', employeeData);
    
    const { 
      name, email, phone, department, position, 
      join_date, home_address, status = 'active', 
      issued_items = '', password_hash = null 
    } = employeeData;
    
    // Validate required fields
    if (!name || !email || !phone || !department || !position || !join_date) {
      throw new Error('Missing required fields');
    }

    // Validate phone is 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    // Check for duplicate email
    const [existingEmail] = await db.execute(
      'SELECT id FROM employees WHERE LOWER(email) = LOWER(?)',
      [email]
    );
    if (existingEmail.length > 0) {
      throw new Error('An employee with this email already exists');
    }

    // Check for duplicate phone
    const [existingPhone] = await db.execute(
      'SELECT id FROM employees WHERE REPLACE(REPLACE(REPLACE(phone, "-", ""), " ", ""), "+", "") = ?',
      [phoneDigits]
    );
    if (existingPhone.length > 0) {
      throw new Error('An employee with this phone number already exists');
    }
    
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
      join_date, home_address, status = 'active', 
      issued_items = '', password_hash = null 
    } = employeeData;

    // Validate phone is 10 digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      throw new Error('Phone number must be exactly 10 digits');
    }

    // Check for duplicate email (exclude current employee)
    const [existingEmail] = await db.execute(
      'SELECT id FROM employees WHERE LOWER(email) = LOWER(?) AND id != ?',
      [email, id]
    );
    if (existingEmail.length > 0) {
      throw new Error('An employee with this email already exists');
    }

    // Check for duplicate phone (exclude current employee)
    const [existingPhone] = await db.execute(
      'SELECT id FROM employees WHERE REPLACE(REPLACE(REPLACE(phone, "-", ""), " ", ""), "+", "") = ? AND id != ?',
      [phoneDigits, id]
    );
    if (existingPhone.length > 0) {
      throw new Error('An employee with this phone number already exists');
    }
    
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