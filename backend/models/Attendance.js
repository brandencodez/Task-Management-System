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
  
  static async getAllActiveEmployees() {
    const [rows] = await pool.execute(`
      SELECT id 
      FROM employees 
      WHERE status='active'
      AND id NOT IN (
        SELECT employee_id 
        FROM leave_requests 
        WHERE leave_date = CURDATE() 
        AND status='approved'
      )
    `);

    return rows;
  }

  static async markAbsent(employeeId, date) {
    await pool.query(
      `INSERT INTO attendance 
       (employee_id, attendance_date, status, work_hours) 
       VALUES (?, ?, 'absent', 0)`,
      [employeeId, date]
    );
  }
  
  static async markLeave(employeeId, date) {
    await pool.query(
      `INSERT INTO attendance 
       (employee_id, attendance_date, status, work_hours) 
       VALUES (?, ?, 'leave', 0)`,
      [employeeId, date]
    );
  }

  // ========== LEAVE REQUEST METHODS (NEW) ==========
  
  // Request leave (creates pending leave request)
  static async requestLeave(employeeId, date, reason) {
    const [result] = await pool.query(
      `INSERT INTO leave_requests 
       (employee_id, leave_date, reason, status, created_at) 
       VALUES (?, ?, ?, 'pending', NOW())
       ON DUPLICATE KEY UPDATE 
       reason = VALUES(reason), 
       status = 'pending'`,
      [employeeId, date, reason]
    );
    return result.insertId;
  }

  // Get pending leave request for a specific date
  static async getPendingLeaveForDate(employeeId, date) {
    const [rows] = await pool.query(
      `SELECT * FROM leave_requests 
       WHERE employee_id = ? AND leave_date = ? AND status = 'pending'`,
      [employeeId, date]
    );
    return rows[0];
  }

  // Get approved leave for a specific date
  static async getApprovedLeaveForDate(employeeId, date) {
    const [rows] = await pool.query(
      `SELECT * FROM leave_requests 
       WHERE employee_id = ? AND leave_date = ? AND status = 'approved'`,
      [employeeId, date]
    );
    return rows[0];
  }

  // Get all pending leave requests (for admin)
  static async getAllPendingLeaves() {
    const [rows] = await pool.query(
      `SELECT 
         lr.*,
         e.name as employee_name,
         d.name as department_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE lr.status = 'pending'
       ORDER BY lr.leave_date ASC`
    );
    return rows;
  }

  // Approve leave request
  static async approveLeave(leaveRequestId) {
    // First get the leave request details
    const [leaveRows] = await pool.query(
      `SELECT employee_id, leave_date FROM leave_requests WHERE id = ?`,
      [leaveRequestId]
    );
    
    if (leaveRows.length === 0) {
      throw new Error('Leave request not found');
    }
    
    const { employee_id, leave_date } = leaveRows[0];
    
    // Update leave request status to approved
    await pool.query(
      `UPDATE leave_requests SET status = 'approved', approved_at = NOW() WHERE id = ?`,
      [leaveRequestId]
    );
    
    // Check if attendance record already exists for this date
    const [existingAttendance] = await pool.query(
      `SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?`,
      [employee_id, leave_date]
    );
    
    // If attendance exists, update it to leave status
    if (existingAttendance.length > 0) {
      await pool.query(
        `UPDATE attendance SET status = 'leave', work_hours = 0 
         WHERE employee_id = ? AND attendance_date = ?`,
        [employee_id, leave_date]
      );
    } else {
      // Create new attendance record with leave status
      await pool.query(
        `INSERT INTO attendance 
         (employee_id, attendance_date, status, work_hours) 
         VALUES (?, ?, 'leave', 0)`,
        [employee_id, leave_date]
      );
    }
    
    return true;
  }

  // Reject leave request
  static async rejectLeave(leaveRequestId) {
    await pool.query(
      `UPDATE leave_requests SET status = 'rejected', rejected_at = NOW() WHERE id = ?`,
      [leaveRequestId]
    );
    return true;
  }

  // Get leave request by ID
  static async getLeaveRequestById(leaveRequestId) {
    const [rows] = await pool.query(
      `SELECT * FROM leave_requests WHERE id = ?`,
      [leaveRequestId]
    );
    return rows[0];
  }

  // ========== END LEAVE REQUEST METHODS ==========

  static async getToday(employeeId, date) {
    const [rows] = await pool.query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? AND attendance_date = ?`,
      [employeeId, date]
    );
    return rows[0];
  }

  // Get today's status including pending leave requests
  static async getTodayWithLeaveStatus(employeeId, date) {
    // First check for attendance record
    const attendanceRecord = await this.getToday(employeeId, date);
    
    // Then check for leave requests (pending or approved)
    const [leaveRows] = await pool.query(
      `SELECT * FROM leave_requests 
       WHERE employee_id = ? AND leave_date = ?
       ORDER BY requested_at DESC LIMIT 1`,
      [employeeId, date]
    );
    
    const leaveRequest = leaveRows[0];
    
    // If there's a pending leave request
    if (leaveRequest && leaveRequest.status === 'pending') {
      return {
        ...attendanceRecord,
        status: 'pending',
        leaveStatus: 'pending',
        leaveReason: leaveRequest.reason,
        leaveRequestId: leaveRequest.id
      };
    }
    
    // If there's an approved leave
    if (leaveRequest && leaveRequest.status === 'approved') {
      return {
        ...attendanceRecord,
        status: 'leave',
        leaveStatus: 'approved',
        leaveReason: leaveRequest.reason,
        leaveRequestId: leaveRequest.id
      };
    }
    
    // If leave was rejected, just return attendance record (or null)
    return attendanceRecord;
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

  static async checkOut(employeeId, date, time, hours, status) {
    await pool.query(
      `UPDATE attendance 
       SET out_time = ?, work_hours = ?, status = ?
       WHERE employee_id = ? AND attendance_date = ?`,
      [time, hours, status, employeeId, date]
    );
  }

  static async getMyAttendance(employeeId) {
    const [rows] = await pool.query(
      `SELECT 
         a.*,
         lr.status as leaveStatus,
         lr.reason as leaveReason
       FROM attendance a
       LEFT JOIN leave_requests lr ON 
         a.employee_id = lr.employee_id 
         AND a.attendance_date = lr.leave_date
       WHERE a.employee_id = ? 
       ORDER BY a.attendance_date DESC
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
        d.name as department,
        lr.status as leaveStatus,
        lr.reason as leaveReason
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN leave_requests lr ON 
         a.employee_id = lr.employee_id 
         AND a.attendance_date = lr.leave_date
       WHERE a.attendance_date = ?
       ORDER BY e.name`,
      [date]
    );
    return rows;
  }

  static async getPendingCheckouts(date) {
    const [rows] = await pool.query(`
      SELECT * FROM attendance
      WHERE attendance_date = ?
        AND in_time IS NOT NULL
        AND out_time IS NULL
        AND status IN ('present','half-day')
    `, [date]);

    return rows;
  }
  
  static async autoCheckout(employeeId, date, outTime, hours, status) {
    await pool.query(`
      UPDATE attendance
      SET out_time = ?, work_hours = ?, status = ?
      WHERE employee_id = ? AND attendance_date = ?
    `, [outTime, hours, status, employeeId, date]);
  }

  static async getMonthlyAnalytics(month) {
    const [summaryRows] = await pool.query(
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
    
    // Get all employee IDs from the summary
    const employeeIds = summaryRows.map(row => row.employee_id);
    
    if (employeeIds.length === 0) {
      return summaryRows.map(row => ({
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
    
    // Now get detailed daily attendance data for all employees in this month
    const placeholders = employeeIds.map(() => '?').join(',');
    const [dailyRows] = await pool.query(
      `SELECT 
         a.employee_id,
         a.attendance_date as date,
         a.status,
         a.work_hours as workHours,
         a.in_time as checkInTime
       FROM attendance a
       WHERE DATE_FORMAT(a.attendance_date, '%Y-%m') = ?
         AND a.employee_id IN (${placeholders})
       ORDER BY a.attendance_date`,
      [month, ...employeeIds]
    );
    
    // Group daily data by employee_id
    const dailyDataByEmployee = {};
    dailyRows.forEach(row => {
      if (!dailyDataByEmployee[row.employee_id]) {
        dailyDataByEmployee[row.employee_id] = [];
      }
      dailyDataByEmployee[row.employee_id].push({
        date: row.date.toISOString(),
        status: row.status,
        workHours: row.workHours || 0,
        overtime: row.overtime || 0,
        checkInTime: row.checkInTime
      });
    });
    
    // Transform summary data and add monthlyData
    return summaryRows.map(row => ({
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
      monthlyData: dailyDataByEmployee[row.employee_id] || []
    }));
  }
}

module.exports = Attendance;