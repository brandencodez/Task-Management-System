const express = require('express');
const Employee = require('../models/Employee');
const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.update(req.params.id, req.body);
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await Employee.delete(req.params.id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;