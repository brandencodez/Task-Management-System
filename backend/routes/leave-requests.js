const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance'); // Import to check attendance

// EMPLOYEE — REQUEST LEAVE
router.post('/request', async (req, res) => {
  try {
    const { employeeId, date, reason } = req.body;
    
    // Validate required fields
    if (!employeeId || !date || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'employeeId, date, and reason are required' 
      });
    }
   
    // Validate and convert date to MySQL-compatible format (YYYY-MM-DD)
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD or valid ISO date string.' 
      });
    }
    const mysqlDate = dateObj.toISOString().split('T')[0]; // Converts to YYYY-MM-DD

    // NEW: Convert employeeId to integer for consistency
    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return res.status(400).json({ error: 'Invalid employeeId format' });
    }

    // NEW: Check if employee has already checked in for this date
    const existingAttendance = await Attendance.getToday(empId, mysqlDate);
    if (existingAttendance && existingAttendance.in_time) {
      return res.status(400).json({ 
        error: 'Cannot apply for leave',
        details: 'You have already checked in for this date' 
      });
    }

    // NEW: Check if there's already a pending leave request for this date
    const existingLeave = await LeaveRequest.getByEmployeeAndDate(empId, mysqlDate);
    if (existingLeave && existingLeave.status === 'pending') {
      return res.status(400).json({ 
        error: 'Duplicate request',
        details: 'You already have a pending leave request for this date' 
      });
    }

    // Create the leave request
    await LeaveRequest.create(empId, mysqlDate, reason);
    
    res.json({ 
      message: 'Leave request submitted successfully. Awaiting admin approval.',
      status: 'pending'
    });
  } catch (err) {
    console.error('Error creating leave request:', err);
    res.status(500).json({ error: err.message });
  }
});

// EMPLOYEE — MY LEAVE REQUESTS
router.get('/my/:employeeId', async (req, res) => {
  try {
    const data = await LeaveRequest.getMyRequests(req.params.employeeId);
    res.json(data);
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// ADMIN — PENDING REQUESTS
router.get('/admin/pending', async (req, res) => {
  try {
    const data = await LeaveRequest.getPending();
    
    // Transform to match frontend expectations (camelCase)
    const transformed = data.map(leave => ({
      id: leave.id,
      employeeId: leave.employee_id || leave.employeeId,
      employeeName: leave.employee_name || leave.employeeName,
      department: leave.department_name || leave.department || 'N/A',
      leaveDate: leave.leave_date || leave.leaveDate,
      leave_date: leave.leave_date || leave.leaveDate, // Keep both for compatibility
      reason: leave.reason,
      status: leave.status,
      createdAt: leave.created_at || leave.createdAt
    }));
    
    res.json(transformed);
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// ADMIN — APPROVE
router.post('/admin/approve/:id', async (req, res) => {
  try {
    const leaveRequestId = parseInt(req.params.id);
    
    if (isNaN(leaveRequestId)) {
      return res.status(400).json({ error: 'Invalid leave request ID' });
    }

    // Check if leave request exists and is pending
    const leaveRequest = await LeaveRequest.getById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request is not pending' });
    }

    await LeaveRequest.approve(leaveRequestId);
    
    res.json({ 
      message: 'Leave approved successfully',
      leaveRequestId: leaveRequestId
    });
  } catch (err) {
    console.error('Error approving leave:', err);
    res.status(500).json({ error: err.message });
  }
});

// ADMIN — REJECT
router.post('/admin/reject/:id', async (req, res) => {
  try {
    const leaveRequestId = parseInt(req.params.id);
    
    if (isNaN(leaveRequestId)) {
      return res.status(400).json({ error: 'Invalid leave request ID' });
    }

    // Check if leave request exists and is pending
    const leaveRequest = await LeaveRequest.getById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request is not pending' });
    }

    await LeaveRequest.reject(leaveRequestId);
    
    res.json({ 
      message: 'Leave rejected successfully',
      leaveRequestId: leaveRequestId
    });
  } catch (err) {
    console.error('Error rejecting leave:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;