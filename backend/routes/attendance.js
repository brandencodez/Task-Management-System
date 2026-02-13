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

    // Check if there's a pending leave request for today
    const pendingLeave = await Attendance.getPendingLeaveForDate(empId, date);
    if (pendingLeave) {
      return res.status(400).json({ 
        error: 'You have a pending leave request for today. Please wait for admin approval or cancel the request.' 
      });
    }

    // Check if there's an approved leave for today
    const approvedLeave = await Attendance.getApprovedLeaveForDate(empId, date);
    if (approvedLeave) {
      return res.status(400).json({ 
        error: 'You have approved leave for today. You cannot check in.' 
      });
    }

    await Attendance.checkIn(empId, status, date, time);

    res.json({ message: 'Checked in successfully', inTime: time, date: date });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Check-in failed', details: err.message });
  }
});

// EMPLOYEE — REQUEST LEAVE (UPDATED)
router.post('/request-leave', async (req, res) => {
  try {
    const { employeeId, date, reason } = req.body;

    if (!employeeId || !date || !reason) {
      return res.status(400).json({ error: 'employeeId, date, and reason required' });
    }

    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return res.status(400).json({ error: 'Invalid employeeId format' });
    }

    // Check if attendance already exists for this date
    const existing = await Attendance.getToday(empId, date);
    if (existing && existing.in_time) {
      return res.status(400).json({ error: 'You have already checked in for this date' });
    }

    // Check if there's already a pending leave request
    const pendingLeave = await Attendance.getPendingLeaveForDate(empId, date);
    if (pendingLeave) {
      return res.status(400).json({ error: 'Leave request already pending for this date' });
    }

    // Create leave request with pending status
    await Attendance.requestLeave(empId, date, reason);

    res.json({ 
      message: 'Leave request submitted successfully. Awaiting admin approval.',
      status: 'pending'
    });
    
  } catch (err) {
    console.error('Leave request error:', err);
    res.status(500).json({ error: 'Leave request failed', details: err.message });
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

    const diffMs =
      new Date(`1970-01-01T${time}`) -
      new Date(`1970-01-01T${record.in_time}`);

    const hours = Math.round((diffMs / 36e5) * 100) / 100;

    // --- HALF DAY LOGIC ---
    let status = 'present';

    if (hours < 4) status = 'absent';
    else if (hours < 7.5) status = 'half-day';

    await Attendance.checkOut(empId, date, time, hours, status);

    res.json({
      message: 'Checked out successfully',
      outTime: time,
      workHours: hours,
      finalStatus: status
    });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Checkout failed', details: err.message });
  }
});

// EMPLOYEE — GET TODAY'S ATTENDANCE (UPDATED)
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
    const record = await Attendance.getTodayWithLeaveStatus(empId, date);
    
    if (!record) {
      return res.json(null);
    }
    
    // Transform to match frontend expectations
    res.json({
      employeeId: record.employee_id,
      date: record.attendance_date || date,
      status: record.status,
      leaveStatus: record.leaveStatus,
      leaveReason: record.leaveReason,
      leaveRequestId: record.leaveRequestId,
      checkInTime: record.in_time,
      checkOutTime: record.out_time,
      workHours: record.work_hours
    });
  } catch (err) {
    console.error('Get today error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s attendance', details: err.message });
  }
});

// EMPLOYEE — HISTORY (UPDATED)
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
    const transformed = data.map(record => {
      // Determine the display status
      let displayStatus = record.status;
      
      // If there's a pending leave request, show as pending
      if (record.leaveStatus === 'pending') {
        displayStatus = 'pending';
      }
      
      return {
        employeeId: record.employee_id,
        date: record.attendance_date,
        status: displayStatus,
        leaveStatus: record.leaveStatus,
        leaveReason: record.leaveReason,
        checkInTime: record.in_time,
        checkOutTime: record.out_time,
        workHours: record.work_hours
      };
    });
    
    res.json(transformed);
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance', details: err.message });
  }
});

// ========== ADMIN LEAVE MANAGEMENT ROUTES (NEW) ==========

// ADMIN — GET ALL PENDING LEAVE REQUESTS
router.get('/admin/leave/pending', async (req, res) => {
  try {
    const pendingLeaves = await Attendance.getAllPendingLeaves();
    
    const transformed = pendingLeaves.map(leave => ({
      id: leave.id,
      employeeId: leave.employee_id,
      employeeName: leave.employee_name,
      department: leave.department_name || 'N/A',
      leaveDate: leave.leave_date,
      reason: leave.reason,
      status: leave.status,
      createdAt: leave.created_at
    }));
    
    res.json(transformed);
  } catch (err) {
    console.error('Get pending leaves error:', err);
    res.status(500).json({ error: 'Failed to fetch pending leaves', details: err.message });
  }
});

// ADMIN — APPROVE LEAVE REQUEST
router.post('/admin/leave/approve/:leaveRequestId', async (req, res) => {
  try {
    const leaveRequestId = parseInt(req.params.leaveRequestId);
    
    if (isNaN(leaveRequestId)) {
      return res.status(400).json({ error: 'Invalid leave request ID' });
    }

    // Check if leave request exists
    const leaveRequest = await Attendance.getLeaveRequestById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request is not pending' });
    }

    await Attendance.approveLeave(leaveRequestId);

    res.json({ 
      message: 'Leave approved successfully',
      leaveRequestId: leaveRequestId
    });
  } catch (err) {
    console.error('Approve leave error:', err);
    res.status(500).json({ error: 'Failed to approve leave', details: err.message });
  }
});

// ADMIN — REJECT LEAVE REQUEST
router.post('/admin/leave/reject/:leaveRequestId', async (req, res) => {
  try {
    const leaveRequestId = parseInt(req.params.leaveRequestId);
    
    if (isNaN(leaveRequestId)) {
      return res.status(400).json({ error: 'Invalid leave request ID' });
    }

    // Check if leave request exists
    const leaveRequest = await Attendance.getLeaveRequestById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request is not pending' });
    }

    await Attendance.rejectLeave(leaveRequestId);

    res.json({ 
      message: 'Leave rejected successfully',
      leaveRequestId: leaveRequestId
    });
  } catch (err) {
    console.error('Reject leave error:', err);
    res.status(500).json({ error: 'Failed to reject leave', details: err.message });
  }
});

// ========== END ADMIN LEAVE MANAGEMENT ROUTES ==========

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
    const transformed = records.map(record => {
      let displayStatus = record.status;
      
      // If there's a pending leave, show as pending
      if (record.leaveStatus === 'pending') {
        displayStatus = 'pending';
      }
      
      return {
        employeeId: record.employee_id,
        employeeName: record.name,
        employeeDepartment: record.department || 'N/A',
        date: record.attendance_date,
        status: displayStatus,
        leaveStatus: record.leaveStatus,
        leaveReason: record.leaveReason,
        checkInTime: record.in_time,
        checkOutTime: record.out_time,
        workHours: record.work_hours
      };
    });
    
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