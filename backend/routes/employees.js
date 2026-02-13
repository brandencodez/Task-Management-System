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

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
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
    const employeeId = parseInt(req.params.id, 10);
    
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    
    const { 
      name, email, phone, department_id, position, 
      join_date, home_address, status, issued_items 
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !department_id || !position || !join_date) {
      return res.status(400).json({ 
        error: 'All required fields must be provided: name, email, phone, department, position, join_date' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate phone format (exactly 10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }
    
    //  Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(join_date)) {
      return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
    }
    
    const employee = await Employee.update(employeeId, req.body);
    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update employee profile
router.put('/:id/profile', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const updated = await Employee.updateProfile(employeeId, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Update employee profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    // Convert string ID to number
    const employeeId = parseInt(req.params.id, 10);
    
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    
    await Employee.delete(employeeId);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;