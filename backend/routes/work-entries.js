const express = require('express');
const router = express.Router();
const WorkEntry = require('../models/WorkEntry');
const db = require('../config/database');

// Helper: extract employeeId from query or body
const getEmployeeId = (req) => {
  return req.query.employeeId || req.body.employeeId;
};

// GET /api/work-entries?employeeId=123
router.get('/', async (req, res) => {
  const employeeId = getEmployeeId(req);
  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const workEntries = await WorkEntry.findAllByEmployee(employeeId);
    res.json(workEntries);
  } catch (err) {
    console.error('GET work entries error:', err);
    res.status(500).json({ message: 'Failed to fetch work entries' });
  }
});

// POST /api/work-entries { project, description, ..., employeeId }
router.post('/', async (req, res) => {
  const { project, description, hours, progress, date, employeeId } = req.body;

  if (!project || !description || !hours || !date || !employeeId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newEntry = await WorkEntry.create({
      project,
      description,
      hours,
      progress,
      date,
      employeeId
    });
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('POST work entry error:', err);
    res.status(400).json({ message: 'Failed to create work entry' });
  }
});

// DELETE /api/work-entries/:id?employeeId=123
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const employeeId = getEmployeeId(req);

  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const result = await WorkEntry.deleteByEmployeeAndId(id, employeeId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('DELETE work entry error:', err);
    res.status(500).json({ message: 'Failed to delete work entry' });
  }
});

// PUT /api/work-entries/:id { ..., employeeId }
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { project, description, hours, progress, date, employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const updated = await WorkEntry.updateByEmployeeAndId(id, employeeId, {
      project,
      description,
      hours,
      progress,
      date
    });

    if (!updated) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }
    res.json(updated);
  } catch (err) {
    console.error('PUT work entry error:', err);
    res.status(400).json({ message: 'Failed to update work entry' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    // Use MySQL's CURDATE() for reliable date comparison
    const [activeEmployees] = await db.execute(
      'SELECT id, name FROM employees WHERE status = ?',
      ['active']
    );

    // Get work entries for TODAY only using MySQL's CURDATE()
    const [todayEntries] = await db.execute(
      'SELECT employee_id FROM work_entries WHERE DATE(date) = CURDATE()'
    );

    console.log('✅ Active employees:', activeEmployees.length);
    console.log('✅ Today entries:', todayEntries.length);

    const submittedEmployeeIds = todayEntries.map(entry => entry.employee_id);
    const submittedEmployees = activeEmployees.filter(emp => 
      submittedEmployeeIds.includes(emp.id)
    );
    const pendingEmployees = activeEmployees.filter(emp => 
      !submittedEmployeeIds.includes(emp.id)
    );

    const totalActive = activeEmployees.length;
    const submittedToday = submittedEmployees.length;
    const notSubmittedToday = pendingEmployees.length;
    const submittedPercentage = totalActive > 0 
      ? Math.round((submittedToday / totalActive) * 100)
      : 0;

    res.json({
      totalActiveEmployees: totalActive,
      submittedToday,
      notSubmittedToday,
      submittedPercentage,
      employeesWithEntries: submittedEmployees.map(emp => emp.name),
      employeesWithoutEntries: pendingEmployees.map(emp => emp.name)
    });
  } catch (error) {
    console.error('❌ Work summary error:', error);
    res.status(500).json({ error: 'Failed to load work summary' });
  }
});

module.exports = router;