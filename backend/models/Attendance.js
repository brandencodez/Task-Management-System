const pool = require('../config/database');

class Attendance {

  // Get employee by name (helper for when frontend sends name instead of ID)
  static async getEmployeeByName(name) {
    const [rows] = await pool.query(
      `SELECT id, name FROM employees WHERE name = ?`,
      [name]
    );
    return rows[0];
  }

  static async getToday(employeeId, date) {
    const [rows] = await pool.query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? AND attendance_date = ?`,
      [employeeId, date]
    );
    return rows[0];
  }

  static async checkIn(employeeId, status, date, time) {
    const [result] = await pool.query(
      `INSERT INTO attendance 
       (employee_id, attendance_date, status, in_time) 
       VALUES (?, ?, ?, ?)`,
      [employeeId, date, status, time]
    );
    return result.insertId;
  }

  static async checkOut(employeeId, date, time, hours) {
    await pool.query(
      `UPDATE attendance 
       SET out_time = ?, work_hours = ? 
       WHERE employee_id = ? AND attendance_date = ?`,
      [time, hours, employeeId, date]
    );
  }

  static async getMyAttendance(employeeId) {
    const [rows] = await pool.query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? 
       ORDER BY attendance_date DESC
       LIMIT 30`,
      [employeeId]
    );
    return rows;
  }

  static async getTodayStats(date) {
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS total
       FROM attendance
       WHERE attendance_date = ?
       GROUP BY status`,
      [date]
    );
    return rows;
  }

  static async getByDate(date) {
    const [rows] = await pool.query(
      `SELECT 
        a.*, 
        e.name,
        d.name as department
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE a.attendance_date = ?
       ORDER BY e.name`,
      [date]
    );
    return rows;
  }

  static async getMonthlyAnalytics(month) {
    const [rows] = await pool.query(
      `SELECT 
         a.employee_id,
         e.name as employeeName,
         d.name as employeeDepartment,
         SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as totalPresent,
         SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as totalAbsent,
         SUM(CASE WHEN a.status = 'half-day' THEN 1 ELSE 0 END) as totalHalfDays,
         SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END) as totalLeaves,
         COUNT(*) as workingDays,
         ROUND(AVG(CASE WHEN a.work_hours IS NOT NULL THEN a.work_hours ELSE 0 END), 1) as averageWorkHours,
         ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as attendancePercentage
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE DATE_FORMAT(a.attendance_date, '%Y-%m') = ?
       GROUP BY a.employee_id, e.name, d.name
       ORDER BY e.name`,
      [month]
    );
    
    // Transform to match frontend expectations
    return rows.map(row => ({
      employeeId: row.employee_id,
      employeeName: row.employeeName,
      employeeDepartment: row.employeeDepartment || 'N/A',
      totalPresent: row.totalPresent,
      totalAbsent: row.totalAbsent,
      totalHalfDays: row.totalHalfDays,
      totalLeaves: row.totalLeaves,
      workingDays: row.workingDays,
      averageWorkHours: row.averageWorkHours,
      attendancePercentage: row.attendancePercentage,
      totalOvertime: 0,
      lateArrivals: 0,
      trend: 0,
      monthlyData: []
    }));
  }
}

module.exports = Attendance;