const express = require('express');
const ProjectMemo = require('../models/ProjectMemo');

const router = express.Router();

/**
 * GET all memos for a project
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const memos = await ProjectMemo.findAllByProject(projectId);
    res.json(memos);
  } catch (error) {
    console.error('Get project memos error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET a single memo
 */
router.get('/:id', async (req, res) => {
  try {
    const memo = await ProjectMemo.findById(req.params.id);
    if (!memo) {
      return res.status(404).json({ error: 'Memo not found' });
    }
    res.json(memo);
  } catch (error) {
    console.error('Get memo error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * CREATE new memo
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating memo:', req.body);
    
    const { projectId, content } = req.body;

    if (!projectId || !content) {
      return res.status(400).json({ error: 'projectId and content are required' });
    }

    const memo = await ProjectMemo.create({
      projectId,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Memo created:', memo);
    res.status(201).json(memo);
  } catch (error) {
    console.error('🔥 Create memo failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPDATE memo
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 Updating memo:', req.params.id);
    
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const memo = await ProjectMemo.update(req.params.id, {
      content,
      updatedAt: new Date()
    });

    console.log('✅ Memo updated:', memo);
    res.json(memo);
  } catch (error) {
    console.error('🔥 Update memo failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE memo
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting memo:', req.params.id);
    
    await ProjectMemo.delete(req.params.id);
    
    console.log('✅ Memo deleted');
    res.json({ message: 'Memo deleted successfully' });
  } catch (error) {
    console.error('🔥 Delete memo failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE all memos for a project
 */
router.delete('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    await ProjectMemo.deleteByProject(projectId);
    res.json({ message: 'All project memos deleted successfully' });
  } catch (error) {
    console.error('Delete project memos error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
