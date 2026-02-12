const express = require('express');
const ProjectAssignment = require('../models/ProjectAssignment');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const departmentId = parseInt(req.query.department_id, 10);
    if (Number.isNaN(departmentId)) {
      return res.status(400).json({ error: 'department_id is required' });
    }

    const assignments = await ProjectAssignment.findByDepartment(departmentId);
    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const assignments = await ProjectAssignment.findByProject(projectId);
    res.json(assignments);
  } catch (error) {
    console.error('Get project assignments error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_id, employee_ids } = req.body;
    const projectId = parseInt(project_id, 10);

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: 'Valid project_id is required' });
    }

    const assignments = await ProjectAssignment.createBulk(projectId, employee_ids);
    res.status(201).json(assignments);
  } catch (error) {
    console.error('Create assignments error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.put('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const { employee_ids } = req.body;

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const assignments = await ProjectAssignment.replaceForProject(projectId, employee_ids || []);
    res.json(assignments);
  } catch (error) {
    console.error('Update assignments error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
