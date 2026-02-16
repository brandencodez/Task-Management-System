const db = require('../config/database');

class Reminder {
  static async create(reminderData) {
    const {
      employee_id, title, purpose, department,
      client_name, client_contact, meeting_link,
      meeting_date, meeting_datetime, remind_on
    } = reminderData;

    const query = `
      INSERT INTO reminders 
      (employee_id, title, purpose, department, client_name, client_contact, meeting_link, meeting_date, meeting_datetime, remind_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      employee_id, title, purpose, department,
      client_name, client_contact, meeting_link,
      meeting_date, meeting_datetime || null, remind_on
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

  static async findByEmployee(employeeId) {
    const query = `
      SELECT 
        r.*,
        e.name as employee_name
      FROM reminders r
      INNER JOIN employees e ON r.employee_id = e.id
      WHERE r.employee_id = ?
      ORDER BY r.meeting_date ASC
    `;
    const [rows] = await db.execute(query, [employeeId]);
    return rows;
  }

  static async markCompleted(id) {
    const query = `UPDATE reminders SET status = 'completed', notified = 0 WHERE id = ?`;
    await db.execute(query, [id]);
  }

  static async markScheduled(id) {
    const query = `UPDATE reminders SET status = 'scheduled' WHERE id = ?`;
    await db.execute(query, [id]);
  }

  static async getNotifications(employeeId) {
    const query = `
      SELECT id, title, meeting_datetime
      FROM reminders
      WHERE employee_id = ?
        AND notified = 1
        AND status = 'scheduled'
      ORDER BY meeting_datetime ASC
    `;
    const [rows] = await db.execute(query, [employeeId]);
    return rows;
  }

  static async clearNotification(id) {
    await db.execute('UPDATE reminders SET notified = 0 WHERE id = ?', [id]);
  }

  static async findById(id) {
    const query = `
      SELECT r.*, e.name as employee_name
      FROM reminders r
      INNER JOIN employees e ON r.employee_id = e.id
      WHERE r.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async update(id, data) {
    const {
      employee_id, title, purpose, department,
      client_name, client_contact, meeting_link,
      meeting_date, meeting_datetime, remind_on
    } = data;

    const query = `
      UPDATE reminders SET
        employee_id = ?, title = ?, purpose = ?, department = ?,
        client_name = ?, client_contact = ?, meeting_link = ?,
        meeting_date = ?, meeting_datetime = ?, remind_on = ?,
        notified = 0, status = 'scheduled'
      WHERE id = ?
    `;

    await db.execute(query, [
      employee_id, title, purpose, department,
      client_name, client_contact, meeting_link,
      meeting_date, meeting_datetime || null, remind_on, id
    ]);
  }

  static async getAllNotifications() {
    const query = `
      SELECT r.id, r.title, r.meeting_datetime, e.name as employee_name
      FROM reminders r
      INNER JOIN employees e ON r.employee_id = e.id
      WHERE r.notified = 1
        AND r.status = 'scheduled'
      ORDER BY r.meeting_datetime ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }
}

module.exports = Reminder;