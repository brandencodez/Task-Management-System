const db = require('../config/database');

class WorkEntry {
  static async create(workEntryData) {
    const { project, description, hours, progress, date, employeeId } = workEntryData;

    const query = `
      INSERT INTO work_entries 
      (project, description, hours, progress, date, employee_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      project,
      description,
      hours,
      progress,
      date,
      employeeId
    ]);

    return { id: result.insertId, ...workEntryData };
  }

  static async findAllByEmployee(employeeId) {
    const query = `
      SELECT * FROM work_entries 
      WHERE employee_id = ?
      ORDER BY date DESC
    `;
    const [rows] = await db.execute(query, [employeeId]);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT * FROM work_entries 
      WHERE id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async update(id, workEntryData) {
    const { project, description, hours, progress, date } = workEntryData;

    const query = `
      UPDATE work_entries 
      SET project = ?, description = ?, hours = ?, progress = ?, date = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      project,
      description,
      hours,
      progress,
      date,
      id
    ]);

    return { id, ...workEntryData };
  }

  static async delete(id) {
    await db.execute('DELETE FROM work_entries WHERE id = ?', [id]);
  }

  // Optional: Get entries for today (used in dashboard stats)
  static async findByDate(employeeId, targetDate) {
    const query = `
      SELECT * FROM work_entries 
      WHERE employee_id = ? AND DATE(date) = ?
      ORDER BY date DESC
    `;
    const [rows] = await db.execute(query, [employeeId, targetDate]);
    return rows;
  }

  // Optional: Get entries for last 7 days
  static async findByWeek(employeeId) {
    const query = `
      SELECT * FROM work_entries 
      WHERE employee_id = ? 
        AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      ORDER BY date DESC
    `;
    const [rows] = await db.execute(query, [employeeId]);
    return rows;
  }

  static async deleteByEmployeeAndId(id, employeeId) {
  const query = 'DELETE FROM work_entries WHERE id = ? AND employee_id = ?';
  const [result] = await db.execute(query, [id, employeeId]);
  return result;
}

static async updateByEmployeeAndId(id, employeeId, updateData) {
  const { project, description, hours, progress, date } = updateData;
  const query = `
    UPDATE work_entries 
    SET project = ?, description = ?, hours = ?, progress = ?, date = ?
    WHERE id = ? AND employee_id = ?
  `;
  const [result] = await db.execute(query, [
    project, description, hours, progress, date,
    id, employeeId
  ]);
  if (result.affectedRows === 0) return null;
  return { id, ...updateData }; // simple return; you can fetch full row if needed
}
}

module.exports = WorkEntry;