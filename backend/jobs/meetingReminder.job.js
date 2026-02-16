const cron = require('node-cron');
const db = require('../config/database');

// Runs every minute — flags meetings starting within the next 1 hour
cron.schedule('* * * * *', async () => {
  try {
    console.log('⏰ Running meeting reminder notification cron job...');

    // Use MySQL NOW() so timezone matches the DB server
    const query = `
      UPDATE reminders
      SET notified = 1
      WHERE meeting_datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR)
        AND notified = 0
        AND status = 'scheduled'
    `;

    const [result] = await db.execute(query);

    if (result.affectedRows > 0) {
      console.log(`🔔 Notified ${result.affectedRows} meeting(s) starting within the next hour`);
    } else {
      console.log('✅ No meetings to notify right now');
    }
  } catch (err) {
    console.error('❌ Meeting notification cron job failed:', err);
  }
});

console.log('📅 Meeting reminder cron job registered (runs every minute)');
