const express = require('express');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const router = express.Router();

/**
 * LOGIN
 * - Uses auth-specific DB query
 * - Compares bcrypt hash correctly
 * - Never exposes password_hash
 */
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    // Auth-specific fetch (includes password_hash)
    const employee = await Employee.findForAuthByName(name);

    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      employee.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password before sending response
    const { password_hash, ...safeEmployee } = employee;

    res.json({
      success: true,
      employee: safeEmployee
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * SET / CHANGE PASSWORD
 * - Used for first login or password reset
 * - Does NOT rely on generic update()
 */
router.post('/set-password', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long' });
    }

    // Auth-specific fetch
    const employee = await Employee.findForAuthByName(name);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Dedicated password update
    await Employee.updatePassword(employee.id, passwordHash);

    res.json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
