const express = require('express');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

const router = express.Router();

/**
 * ✅ Get all admins
 */
router.get('/', async (req, res) => {
  try {
    const admins = await Admin.findAll();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Create admin (Registration)
 */
router.post('/', async (req, res) => {
  try {
    const admin = await Admin.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      admin
    });

  } catch (error) {
    console.error('🔥 Admin register error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
});



/**
 * ✅ Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await Admin.findByEmail(email);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ❌ Do not return password_hash
    res.json({
      message: 'Login successful',
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Update admin
 */
router.put('/:id', async (req, res) => {
  try {
    const admin = await Admin.update(req.params.id, req.body);
    res.json(admin);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ✅ Update admin password
 */
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    await Admin.updatePassword(req.params.id, password);
    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ Delete admin
 */
router.delete('/:id', async (req, res) => {
  try {
    await Admin.delete(req.params.id);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
