const pool = require('../config/database');

class LeaveRequest {

  static async create(employeeId, date, reason) {
    const [res] = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_date, reason)
       VALUES (?, ?, ?)`,
      [employeeId, date, reason]
    );
    return res.insertId;
  }

  static async getMyRequests(employeeId) {
    const [rows] = await pool.query(
      `SELECT * FROM leave_requests 
       WHERE employee_id = ?
       ORDER BY requested_at DESC`,
      [employeeId]
    );
    return rows;
  }

  static async getPending() {
    const [rows] = await pool.query(`
      SELECT lr.*, e.name AS employeeName, d.name AS department
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE lr.status = 'pending'
      ORDER BY lr.requested_at ASC
    `);
    return rows;
  }

  static async approve(id) {
    const [[leave]] = await pool.query(
      `SELECT * FROM leave_requests WHERE id = ?`, [id]
    );

    await pool.query(
      `INSERT INTO attendance (employee_id, attendance_date, status)
       VALUES (?, ?, 'leave')`,
      [leave.employee_id, leave.leave_date]
    );

    await pool.query(
      `UPDATE leave_requests SET status='approved', actioned_at=NOW() WHERE id=?`,
      [id]
    );
  }
static async getById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM leave_requests WHERE id = ?`,
    [id]
  );
  return rows[0];
}

static async getByEmployeeAndDate(employeeId, leaveDate) {
  const [rows] = await pool.query(
    `SELECT * FROM leave_requests 
     WHERE employee_id = ? AND leave_date = ?`,
    [employeeId, leaveDate]
  );
  return rows[0];
}
  static async reject(id) {
    await pool.query(
      `UPDATE leave_requests SET status='rejected', actioned_at=NOW() WHERE id=?`,
      [id]
    );
  }
}

module.exports = LeaveRequest;
