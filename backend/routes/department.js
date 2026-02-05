const express = require('express');
const Department = require('../models/Department');
const router = express.Router();


// ✅ Get all departments (admin view)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Get only active departments (for dropdowns)
router.get('/active', async (req, res) => {
  try {
    const departments = await Department.findActive();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Create department
router.post('/', async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const department = await Department.create({
      name,
      description,
      status
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// ✅ Update department
router.put('/:id', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id, 10);

    if (isNaN(departmentId)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const department = await Department.update(departmentId, {
      name,
      description,
      status
    });

    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(400).json({ error: error.message });
  }
});


// ✅ Disable department (soft delete)
router.patch('/:id/disable', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id, 10);

    if (isNaN(departmentId)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    await Department.disable(departmentId);
    res.json({ message: 'Department disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Enable department
router.patch('/:id/enable', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id, 10);

    if (isNaN(departmentId)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    await Department.enable(departmentId);
    res.json({ message: 'Department enabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
