const db = require('../config/database');

class Reminder {
  static async create(reminderData) {
    const {
      employee_id, title, purpose, department,
      client_name, client_contact, meeting_link,
      meeting_date, remind_on
    } = reminderData;

    const query = `
      INSERT INTO reminders 
      (employee_id, title, purpose, department, client_name, client_contact, meeting_link, meeting_date, remind_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      employee_id, title, purpose, department,
      client_name, client_contact, meeting_link,
      meeting_date, remind_on
    ]);

    return { id: result.insertId, ...reminderData };
  }

  static async findAll() {
    const query = `
      SELECT 
        r.*,
        e.name as employee_name
      FROM reminders r
      INNER JOIN employees e ON r.employee_id = e.id
      ORDER BY r.meeting_date ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  static async delete(id) {
    await db.execute('DELETE FROM reminders WHERE id = ?', [id]);
  }
}

module.exports = Reminder;