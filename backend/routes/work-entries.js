const express = require('express');
const router = express.Router();
const WorkEntry = require('../models/WorkEntry');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Create secure upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads/work-entries');
(async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
})();

// Secure storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Extended file validation - ALL requested types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    // Text
    'text/plain', 'text/html', 'text/markdown',
    // Video
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // Other
    'application/json'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: Images, PDF, DOC/X, XLS/X, CSV, PPT/X, TXT, MP4, MP3, ZIP, etc.'));
  }
};

const upload = multer({
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max per file
    files: 5 // Max 5 files per request
  },
  fileFilter
});

/**
 * Helper function to extract employeeId from query or body
 */
const getEmployeeId = (req) => {
  return req.query.employeeId || req.body.employeeId;
};

/**
 * GET /api/work-entries?employeeId=123
 * Fetch all work entries for a specific employee
 */
router.get('/', async (req, res) => {
  const employeeId = getEmployeeId(req);
  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const workEntries = await WorkEntry.findAllByEmployee(employeeId);
    res.json(workEntries);
  } catch (err) {
    console.error('GET work entries error:', err);
    res.status(500).json({ message: 'Failed to fetch work entries' });
  }
});

/**
 * POST /api/work-entries
 * Create work entry WITH attachments in single request
 */
router.post('/', upload.array('attachments', 5), async (req, res) => {
  const { project, description, hours, date, employeeId } = req.body;

  if (!project || !description || !hours || !date || !employeeId) {
    // Cleanup orphaned files
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(path.join(UPLOAD_DIR, file.filename)).catch(() => {});
      });
    }
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Validate attachments (if any provided)
    if (req.files && req.files.length > 0) {
      // Check file count
      if (req.files.length > 5) {
        req.files.forEach(file => {
          fs.unlink(path.join(UPLOAD_DIR, file.filename)).catch(() => {});
        });
        return res.status(400).json({ message: 'Maximum 5 attachments allowed' });
      }
    }

    // Create work entry first
    const newEntry = await WorkEntry.create({
      project,
      description,
      hours,
      date,
      employeeId
    });

    // Add attachments if provided
    const savedAttachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const attachment = await WorkEntry.addAttachment(newEntry.id, {
          filename: file.filename,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size
        });
        savedAttachments.push(attachment);
      }
    }

    res.status(201).json({
      ...newEntry,
      attachments: savedAttachments
    });
  } catch (err) {
    // Cleanup on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(path.join(UPLOAD_DIR, file.filename)).catch(() => {});
      });
    }
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Max 100MB per file.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Maximum 5 files allowed.' });
    }
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({ message: err.message });
    }
    
    console.error('POST work entry error:', err);
    res.status(500).json({ message: 'Failed to create work entry' });
  }
});

/**
 * DELETE /api/work-entries/:id
 * Delete work entry (attachments auto-deleted via CASCADE)
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const employeeId = getEmployeeId(req);

  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const result = await WorkEntry.deleteByEmployeeAndId(id, employeeId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('DELETE work entry error:', err);
    res.status(500).json({ message: 'Failed to delete work entry' });
  }
});

/**
 * PUT /api/work-entries/:id
 * Update an existing work entry
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { project, description, hours, date, employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'employeeId is required' });
  }

  try {
    const updated = await WorkEntry.updateByEmployeeAndId(id, employeeId, {
      project,
      description,
      hours,
      date
    });

    if (!updated) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }
    res.json(updated);
  } catch (err) {
    console.error('PUT work entry error:', err);
    res.status(400).json({ message: 'Failed to update work entry' });
  }
});

/**
 * GET /api/work-entries/summary
 * Get daily work entry statistics
 */
router.get('/summary', async (req, res) => {
  try {
    // Fetch active employees with their department information
    const [activeEmployees] = await db.execute(`
      SELECT 
        e.id, 
        e.name,
        COALESCE(d.name, 'No Department') as department
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = ?
    `, ['active']);

    // Get work entries for TODAY only using MySQL's CURDATE()
    const [todayEntries] = await db.execute(
      'SELECT employee_id FROM work_entries WHERE DATE(date) = CURDATE()'
    );

    console.log('✅ Active employees:', activeEmployees.length);
    console.log('✅ Today entries:', todayEntries.length);

    // Get employee IDs who submitted entries today
    const submittedEmployeeIds = todayEntries.map(entry => entry.employee_id);
    
    // Filter employees who submitted today
    const submittedEmployees = activeEmployees
      .filter(emp => submittedEmployeeIds.includes(emp.id))
      .map(emp => ({
        name: emp.name,
        department: emp.department
      }));
    
    // Filter employees who haven't submitted today
    const pendingEmployees = activeEmployees
      .filter(emp => !submittedEmployeeIds.includes(emp.id))
      .map(emp => ({
        name: emp.name,
        department: emp.department
      }));

    const totalActive = activeEmployees.length;
    const submittedToday = submittedEmployees.length;
    const notSubmittedToday = pendingEmployees.length;

    res.json({
      totalActiveEmployees: totalActive,
      submittedToday,
      notSubmittedToday,
      employeesWithEntries: submittedEmployees,
      employeesWithoutEntries: pendingEmployees
    });
  } catch (error) {
    console.error('❌ Work summary error:', error);
    res.status(500).json({ error: 'Failed to load work summary' });
  }
});

module.exports = router;