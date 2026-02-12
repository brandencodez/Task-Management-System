const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path'); 
require('dotenv').config();

// Routes
const employeeRoutes = require('./routes/employees');
const projectRoutes = require('./routes/projects');
const authRoutes = require('./routes/auth');
const AdminRoutes = require('./routes/admin');
const reminderRoutes = require('./routes/reminder');
const workEntriesRouter = require('./routes/work-entries');
const DepartmentRoutes = require('./routes/department');
const attendanceRoutes = require('./routes/attendance');
const assignmentRoutes = require('./routes/assignments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:4200', 
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// SERVE UPLOADS STATICALLY 
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mediaExts = ['.mp4', '.mp3', '.wav', '.ogg', '.webm', '.avi'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    if (mediaExts.includes(ext)) {
      res.set('Content-Security-Policy', "default-src 'none'; media-src 'self'; frame-ancestors 'none'");
    } else if (imageExts.includes(ext)) {
      res.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; frame-ancestors 'none'");
    } else {
      res.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }

    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store, max-age=0');
  }
}));

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/work-entries', workEntriesRouter);
app.use('/api/admins', AdminRoutes);
app.use('/api/departments', DepartmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads served at: http://localhost:${PORT}/uploads/`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});