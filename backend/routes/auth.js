const express = require('express');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    // Find employee by name (case-insensitive)
    const employees = await Employee.findByName(name);
    const employee = employees.find(emp => 
      emp.name.toLowerCase() === name.toLowerCase()
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has a password set
    if (!employee.password_hash) {
      return res.status(400).json({ error: 'Password not set. Please set a password first.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Remove password hash from response for security
    const { password_hash, ...employeeWithoutPassword } = employee;
    
    res.json({ success: true, employee: employeeWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set password endpoint
router.post('/set-password', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find employee by name
    const employees = await Employee.findByName(name);
    const employee = employees.find(emp => 
      emp.name.toLowerCase() === name.toLowerCase()
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update employee with hashed password
    const updatedEmployee = await Employee.update(employee.id, {
      ...employee,
      password_hash: passwordHash
    });

    const { password_hash, ...employeeWithoutPassword } = updatedEmployee;
    
    res.json({ success: true, message: 'Password set successfully', employee: employeeWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;