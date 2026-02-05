const db = require('../config/database');

class Department {

  // ✅ Create department
  static async create(departmentData) {
    const {
      name,
      description = '',
      status = 'active'
    } = departmentData;

    if (!name) {
      throw new Error('Department name is required');
    }

    // Check for duplicate department name
    const [existing] = await db.execute(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (existing.length > 0) {
      throw new Error('Department with this name already exists');
    }

    const query = `
      INSERT INTO departments (name, description, status)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      name,
      description,
      status
    ]);

    return {
      id: result.insertId,
      name,
      description,
      status
    };
  }

  // ✅ Get all departments (admin view)
  static async findAll() {
  const [rows] = await db.execute(`
    SELECT 
      d.id,
      d.name,
      d.description,
      d.status,
      COUNT(DISTINCT e.id) AS employee_count,
      COUNT(DISTINCT p.id) AS project_count
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id
    LEFT JOIN projects p ON p.department_id = d.id
    GROUP BY d.id
    ORDER BY d.name
  `);
  return rows;
}


  // ✅ Get only active departments (dropdowns)
  static async findActive() {
    const [rows] = await db.execute(
      'SELECT id, name FROM departments WHERE status = "active" ORDER BY name'
    );
    return rows;
  }

  // ✅ Find department by ID
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, name, description, status FROM departments WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // ✅ Update department
  static async update(id, departmentData) {
    const {
      name,
      description = '',
      status = 'active'
    } = departmentData;

    if (!name) {
      throw new Error('Department name is required');
    }

    // Check for duplicate name (exclude current department)
    const [existing] = await db.execute(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER(?) AND id != ?',
      [name, id]
    );

    if (existing.length > 0) {
      throw new Error('Another department with this name already exists');
    }

    const query = `
      UPDATE departments
      SET name = ?, description = ?, status = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      name,
      description,
      status,
      id
    ]);

    return { id, name, description, status };
  }

  // ✅ Soft delete (disable)
  static async disable(id) {
    await db.execute(
      'UPDATE departments SET status = "inactive" WHERE id = ?',
      [id]
    );
  }

  // ✅ Enable department
  static async enable(id) {
    await db.execute(
      'UPDATE departments SET status = "active" WHERE id = ?',
      [id]
    );
  }

  // ✅ Find by name (optional utility)
  static async findByName(name) {
    const [rows] = await db.execute(
      'SELECT id, name, description, status FROM departments WHERE name LIKE ?',
      [`%${name}%`]
    );
    return rows;
  }
}

module.exports = Department;
