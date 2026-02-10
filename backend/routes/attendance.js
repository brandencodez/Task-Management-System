const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

const todayDate = () => new Date().toISOString().split('T')[0];
const currentTime = () => new Date().toTimeString().slice(0, 8);

// EMPLOYEE — CHECK-IN
router.post('/check-in', async (req, res) => {
  try {
    const { employeeId, status } = req.body;

    if (!employeeId || !status) {
      return res.status(400).json({ error: 'employeeId and status required' });
    }

    // Convert employeeId to integer
    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return res.status(400).json({ error: 'Invalid employeeId format' });
    }

    const date = todayDate();
    const time = currentTime();

    const existing = await Attendance.getToday(empId, date);

    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked today' });
    }

    await Attendance.checkIn(empId, status, date, time);

    res.json({ message: 'Checked in successfully', inTime: time, date: date });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Check-in failed', details: err.message });
  }
});

// EMPLOYEE — CHECK-OUT
router.post('/check-out', async (req, res) => {
  try {
    const { employeeId } = req.body;

    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return res.status(400).json({ error: 'Invalid employeeId format' });
    }

    const date = todayDate();
    const time = currentTime();

    const record = await Attendance.getToday(empId, date);

    if (!record) {
      return res.status(400).json({ error: 'No check-in found for today' });
    }

    if (record.out_time) {
      return res.status(400).json({ error: 'Already checked out' });
    }

    // Calculate work hours: checkout time - checkin time
    const diffMs =
      new Date(`1970-01-01T${time}`) -
      new Date(`1970-01-01T${record.in_time}`);

    // Convert to hours and round to 2 decimal places for accuracy
    const hours = Math.round((diffMs / 36e5) * 100) / 100;

    await Attendance.checkOut(empId, date, time, hours);

    res.json({
      message: 'Checked out successfully',
      outTime: time,
      workHours: hours
    });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Checkout failed', details: err.message });
  }
});

// EMPLOYEE — GET TODAY'S ATTENDANCE
router.get('/today/:employeeId', async (req, res) => {
  try {
    let empId = parseInt(req.params.employeeId);
    if (isNaN(empId)) {
      // If not a number, try to get employee by name
      const employee = await Attendance.getEmployeeByName(req.params.employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      empId = employee.id;
    }

    const date = todayDate();
    const record = await Attendance.getToday(empId, date);
    
    if (!record) {
      return res.json(null);
    }
    
    // Transform to match frontend expectations
    res.json({
      employeeId: record.employee_id,
      date: record.attendance_date,
      status: record.status,
      checkInTime: record.in_time,
      checkOutTime: record.out_time,
      workHours: record.work_hours
    });
  } catch (err) {
    console.error('Get today error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s attendance', details: err.message });
  }
});

// EMPLOYEE — HISTORY
router.get('/my/:employeeId', async (req, res) => {
  try {
    let empId = parseInt(req.params.employeeId);
    
    if (isNaN(empId)) {
      // Try to get employee by name
      const employee = await Attendance.getEmployeeByName(req.params.employeeId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      empId = employee.id;
    }

    const data = await Attendance.getMyAttendance(empId);
    
    // Transform data to match frontend expectations
    const transformed = data.map(record => ({
      employeeId: record.employee_id,
      date: record.attendance_date,
      status: record.status,
      checkInTime: record.in_time,
      checkOutTime: record.out_time,
      workHours: record.work_hours
    }));
    
    res.json(transformed);
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance', details: err.message });
  }
});

// ADMIN — DASHBOARD
router.get('/admin/today', async (req, res) => {
  try {
    const date = todayDate();
    const stats = await Attendance.getTodayStats(date);
    res.json(stats);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Dashboard fetch failed', details: err.message });
  }
});

// ADMIN — DAILY VIEW
router.get('/admin/date/:date', async (req, res) => {
  try {
    const records = await Attendance.getByDate(req.params.date);
    
    // Transform data to match frontend expectations
    const transformed = records.map(record => ({
      employeeId: record.employee_id,
      employeeName: record.name,
      employeeDepartment: record.department || 'N/A',
      date: record.attendance_date,
      status: record.status,
      checkInTime: record.in_time,
      checkOutTime: record.out_time,
      workHours: record.work_hours
    }));
    
    res.json(transformed);
  } catch (err) {
    console.error('Get by date error:', err);
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
});

// ADMIN — MONTHLY ANALYTICS
router.get('/admin/monthly/:month', async (req, res) => {
  try {
    const analytics = await Attendance.getMonthlyAnalytics(req.params.month);
    res.json(analytics);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Analytics fetch failed', details: err.message });
  }
});

module.exports = router;