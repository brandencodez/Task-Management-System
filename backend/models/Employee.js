const db = require('../config/database');
const bcrypt = require('bcrypt');

class Employee {
  static async create(employeeData) {
    console.log('🔍 Received employee data:', employeeData);

    const {
      name,
      email,
      phone,
      department_id,
      position,
      join_date,
      home_address,
      status = 'active',
      issued_items = ''
    } = employeeData;

    // Validate required fields
    if (!name || !email || !phone || !position || !join_date) {
      throw new Error('Missing required fields');
    }
    // Validate department_id is a valid number
    const departmentId = Number(department_id);
if (!departmentId) {
  throw new Error('Valid department is required');
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

    // 🔐 Default password logic
    const defaultPassword = '123456';
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    // Validate department exists and is active
    const [dept] = await db.execute(
  'SELECT id FROM departments WHERE id = ? AND  status = "active"',
  [department_id]
);

if (dept.length === 0) {
  throw new Error('Invalid or inactive department');
}


    const query = `
      INSERT INTO employees
(name, email, phone, department_id, position, join_date, home_address, status, issued_items, password_hash)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    `;

    const [result] = await db.execute(query, [
      name,
      email,
      phone,
      department_id,
      position,
      join_date,
      home_address,
      status,
      issued_items,
      password_hash
    ]);

    return {
      id: result.insertId,
      name,
      email,
      phone,
      department_id,
      position,
      join_date,
      home_address,
      status,
      issued_items
      // ❌ never return password_hash
    };
  }

  static async findAll() {
  const [rows] = await db.execute(`
    SELECT 
      e.id,
      e.name,
      e.email,
      e.phone,
      e.department_id,
      d.name AS department_name,
      e.position,
      e.join_date,
      e.home_address,
      e.status,
      e.issued_items
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.id
  `);
  return rows;
}


  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, department_id, position, join_date, home_address, status, issued_items FROM employees WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, employeeData) {
    const {
      name,
      email,
      phone,
      department_id,
      position,
      join_date,
      home_address,
      status = 'active',
      issued_items = ''
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
      SET name = ?, email = ?, phone = ?, department_id = ?, position = ?,
          join_date = ?, home_address = ?, status = ?, issued_items = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      name,
      email,
      phone,
      department_id,
      position,
      join_date,
      home_address,
      status,
      issued_items,
      id
    ]);

    return { id, ...employeeData };
  }

  static async delete(id) {
    await db.execute('DELETE FROM employees WHERE id = ?', [id]);
  }

  static async findByName(name) {
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, department_id, position FROM employees WHERE name LIKE ?',
      [`%${name}%`]
    );
    return rows;
  }
  static async findForAuthByName(name) {
  const [rows] = await db.execute(
    'SELECT * FROM employees WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name]
  );
  return rows[0];
}

static async updatePassword(id, password_hash) {
  await db.execute(
    'UPDATE employees SET password_hash = ? WHERE id = ?',
    [password_hash, id]
  );
}

}


module.exports = Employee;
