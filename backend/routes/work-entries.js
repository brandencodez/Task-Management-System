// backend/routes/work-entries.js
const express = require('express');
const router = express.Router();
const WorkEntry = require('../models/WorkEntry');

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

module.exports = router;