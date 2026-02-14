const cron = require('node-cron');
const Attendance = require('../models/Attendance');

const todayDate = () => new Date().toISOString().split('T')[0];

// Runs daily at 6:00 PM to mark absent employees who haven't checked in
cron.schedule('00 18 * * *', async () => {
  try {
    console.log('⏰ Running auto-absent cron job...');

    const date = todayDate();
    const employees = await Attendance.getAllActiveEmployees();

    let marked = 0;

    for (const emp of employees) {
      const existing = await Attendance.getToday(emp.id, date);

      if (!existing) {
        await Attendance.markAbsent(emp.id, date);
        marked++;
      }
    }

    console.log(`✅ Auto-absent complete — ${marked} employees marked absent`);
  } catch (err) {
    console.error('❌ Auto-absent job failed:', err);
  }
});
