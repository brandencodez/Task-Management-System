const express = require('express');
const Reminder = require('../models/Reminder');
const router = express.Router();

// GET /api/reminders
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.findAll();
    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// GET /api/reminders/notifications/all — admin: all notifications
router.get('/notifications/all', async (req, res) => {
  try {
    const notifications = await Reminder.getAllNotifications();
    res.json(notifications);
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/reminders/employee/:employeeId
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const reminders = await Reminder.findByEmployee(req.params.employeeId);
    res.json(reminders);
  } catch (error) {
    console.error('Get employee reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch employee reminders' });
  }
});

// POST /api/reminders
router.post('/', async (req, res) => {
  try {
    const reminder = await Reminder.create(req.body);
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(400).json({ error: 'Failed to create reminder' });
  }
});

// GET /api/reminders/:id
router.get('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json(reminder);
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

// PUT /api/reminders/:id
router.put('/:id', async (req, res) => {
  try {
    await Reminder.update(req.params.id, req.body);
    res.json({ message: 'Reminder updated successfully' });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', async (req, res) => {
  try {
    await Reminder.delete(req.params.id);
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// PATCH /api/reminders/:id/complete — Toggle completed status
router.patch('/:id/complete', async (req, res) => {
  try {
    await Reminder.markCompleted(req.params.id);
    res.json({ message: 'Reminder marked as completed' });
  } catch (error) {
    console.error('Mark completed error:', error);
    res.status(500).json({ error: 'Failed to mark as completed' });
  }
});

// PATCH /api/reminders/:id/reopen — Reopen a completed reminder
router.patch('/:id/reopen', async (req, res) => {
  try {
    await Reminder.markScheduled(req.params.id);
    res.json({ message: 'Reminder reopened' });
  } catch (error) {
    console.error('Reopen error:', error);
    res.status(500).json({ error: 'Failed to reopen reminder' });
  }
});

// GET /api/reminders/employee/:employeeId/notifications
router.get('/employee/:employeeId/notifications', async (req, res) => {
  try {
    const notifications = await Reminder.getNotifications(req.params.employeeId);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/reminders/:id/dismiss-notification
router.patch('/:id/dismiss-notification', async (req, res) => {
  try {
    await Reminder.clearNotification(req.params.id);
    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    console.error('Dismiss notification error:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

module.exports = router;