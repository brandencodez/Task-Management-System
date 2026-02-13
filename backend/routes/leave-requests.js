const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance'); // Import to check attendance

// EMPLOYEE — REQUEST LEAVE
router.post('/request', async (req, res) => {
  try {
    const { employeeId, fromDate, toDate, reason } = req.body;

    if (!employeeId || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'employeeId, fromDate, toDate, and reason are required'
      });
    }

    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return res.status(400).json({ error: 'Invalid employeeId' });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (end < start) {
      return res.status(400).json({ error: 'To date must be after from date' });
    }

    const today = new Date().toISOString().split('T')[0];
    const insertedDates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];

      // If today: prevent leave if already checked in
      if (date === today) {
        const attendance = await Attendance.getToday(empId, date);
        if (attendance && attendance.in_time) {
          return res.status(400).json({
            error: 'Cannot apply leave',
            details: 'You have already checked in today'
          });
        }
      }

      // Prevent duplicate pending leave
      const existingLeave = await LeaveRequest.getByEmployeeAndDate(empId, date);
      if (existingLeave && existingLeave.status === 'pending') {
        continue; // skip duplicates
      }

      await LeaveRequest.create(empId, date, reason);
      insertedDates.push(date);
    }

    if (!insertedDates.length) {
      return res.status(400).json({
        error: 'No new leave entries created',
        details: 'Leave already exists for selected date range'
      });
    }

    res.json({
      message: `Leave request submitted for ${insertedDates.length} day(s). Awaiting admin approval.`,
      insertedDates
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