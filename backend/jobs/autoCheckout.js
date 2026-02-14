const cron = require('node-cron');
const Attendance = require('../models/Attendance');

cron.schedule('30 19 * * *', async () => {  // 7:30 PM
  const date = new Date().toISOString().split('T')[0];
  const outTime = '19:30:00';

  const pending = await Attendance.getPendingCheckouts(date);

  for (const rec of pending) {
    const diffMs =
      new Date(`1970-01-01T${outTime}`) -
      new Date(`1970-01-01T${rec.in_time}`);

    const hours = Math.round((diffMs / 36e5) * 100) / 100;

    let status = 'present';
    if (hours < 4) status = 'absent';
    else if (hours < 7.5) status = 'half-day';

    await Attendance.autoCheckout(
      rec.employee_id,
      date,
      outTime,
      hours,
      status
    );
  }

  console.log('Auto checkout executed');
});
