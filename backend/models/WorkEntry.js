const db = require('../config/database');

class WorkEntry {
  /**
   * Create a new work entry
   */
  static async create(workEntryData) {
    const { 
      project, 
      description, 
      hours, 
      date, 
      employeeId,
      attachment_filename,
      attachment_mime_type
    } = workEntryData;

    const query = `
      INSERT INTO work_entries 
      (project, description, hours, date, employee_id, attachment_filename, attachment_mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      project,
      description,
      hours,
      date,
      employeeId,
      attachment_filename || null,
      attachment_mime_type || null
    ]);

    return {
      id: result.insertId,
      project,
      description,
      hours,
      date,
      employeeId,
      attachment_filename,
      attachment_mime_type
    };
  }

  /**
   * Find all work entries for a specific employee
   */
  static async findAllByEmployee(employeeId) {
    const query = `
      SELECT * FROM work_entries 
      WHERE employee_id = ?
      ORDER BY date DESC, id DESC
    `;
    const [rows] = await db.execute(query, [employeeId]);
    return rows;
  }

  /**
   * Find a single work entry by ID
   */
  static async findById(id) {
    const query = `
      SELECT * FROM work_entries 
      WHERE id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  /**
   * Update a work entry
   */
  static async update(id, workEntryData) {
    const { project, description, hours, date } = workEntryData;

    const query = `
      UPDATE work_entries 
      SET project = ?, description = ?, hours = ?, date = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      project,
      description,
      hours,
      date,
      id
    ]);

    return { id, ...workEntryData };
  }

  /**
   * Delete a work entry by ID
   */
  static async delete(id) {
    await db.execute('DELETE FROM work_entries WHERE id = ?', [id]);
  }

  /**
   * Get work entries for a specific date
   */
  static async findByDate(employeeId, targetDate) {
    const query = `
      SELECT * FROM work_entries 
      WHERE employee_id = ? AND DATE(date) = ?
      ORDER BY date DESC
    `;
    const [rows] = await db.execute(query, [employeeId, targetDate]);
    return rows;
  }

  /**
   * Get work entries for the last 7 days
   */
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

  /**
   * Delete a work entry (with employee authorization)
   */
  static async deleteByEmployeeAndId(id, employeeId) {
    const query = 'DELETE FROM work_entries WHERE id = ? AND employee_id = ?';
    const [result] = await db.execute(query, [id, employeeId]);
    return result;
  }

  /**
   * Update a work entry (with employee authorization)
   */
  static async updateByEmployeeAndId(id, employeeId, updateData) {
    const { project, description, hours, date } = updateData;
    
    const query = `
      UPDATE work_entries 
      SET project = ?, description = ?, hours = ?, date = ?
      WHERE id = ? AND employee_id = ?
    `;
    
    const [result] = await db.execute(query, [
      project, 
      description, 
      hours, 
      date,
      id, 
      employeeId
    ]);
    
    if (result.affectedRows === 0) return null;
    return { id, ...updateData };
  }
}

module.exports = WorkEntry;