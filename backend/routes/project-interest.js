const express = require('express');
const ProjectInterest = require('../models/ProjectInterest');
const router = express.Router();

// Save or update employee's interest in a project
router.post('/', async (req, res) => {
  try {
    const { project_id, employee_id, employee_name, interest_status } = req.body;

    // Validate required fields
    if (!project_id || !employee_id || !employee_name || !interest_status) {
      return res.status(400).json({ 
        error: 'All required fields must be provided: project_id, employee_id, employee_name, interest_status' 
      });
    }

    // Validate interest_status
    if (!['yes', 'no'].includes(interest_status)) {
      return res.status(400).json({ 
        error: 'Invalid interest status. Must be "yes" or "no"' 
      });
    }

    const result = await ProjectInterest.saveInterest(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Save interest error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get specific interest for an employee and project
router.get('/employee/:employeeId/project/:projectId', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(employeeId) || isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid employee ID or project ID' });
    }

    const interest = await ProjectInterest.getInterest(employeeId, projectId);
    
    if (!interest) {
      return res.json({ interest_status: null });
    }

    res.json(interest);
  } catch (error) {
    console.error('Get interest error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all interests for a specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);

    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const interests = await ProjectInterest.getEmployeeInterests(employeeId);
    res.json(interests);
  } catch (error) {
    console.error('Get employee interests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all interested candidates for a project (Admin view)
router.get('/project/:projectId/interested', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const candidates = await ProjectInterest.getInterestedCandidates(projectId);
    res.json(candidates);
  } catch (error) {
    console.error('Get interested candidates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get interest statistics for a project
router.get('/project/:projectId/stats', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const stats = await ProjectInterest.getProjectStats(projectId);
    res.json(stats);
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all interests for a project (both yes and no)
router.get('/project/:projectId/all', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const interests = await ProjectInterest.getAllProjectInterests(projectId);
    res.json(interests);
  } catch (error) {
    console.error('Get all project interests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an interest record
router.delete('/employee/:employeeId/project/:projectId', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(employeeId) || isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid employee ID or project ID' });
    }

    const result = await ProjectInterest.deleteInterest(employeeId, projectId);
    res.json(result);
  } catch (error) {
    console.error('Delete interest error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;