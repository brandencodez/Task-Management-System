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
      employeeId
    } = workEntryData;

    const query = `
      INSERT INTO work_entries 
      (project, description, hours, date, employee_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      project,
      description,
      hours,
      date,
      employeeId
    ]);

    return {
      id: result.insertId,
      project,
      description,
      hours,
      date,
      employeeId
    };
  }

  /**
   * Find all work entries for a specific employee with attachments
   */
  static async findAllByEmployee(employeeId) {
  // Get work entries
  const [entries] = await db.execute(`
    SELECT * FROM work_entries 
    WHERE employee_id = ?
    ORDER BY date DESC, id DESC
  `, [employeeId]);

  // Get attachments for each entry
  const entryIds = entries.map(e => e.id);
  if (entryIds.length === 0) return entries;

  const placeholders = entryIds.map(() => '?').join(',');
  const [attachments] = await db.execute(`
    SELECT * FROM work_entry_attachments
    WHERE work_entry_id IN (${placeholders})
    ORDER BY upload_date ASC
  `, entryIds);

  // Map attachments to entries
  const attachmentsMap = {};
  attachments.forEach(att => {
    if (!attachmentsMap[att.work_entry_id]) {
      attachmentsMap[att.work_entry_id] = [];
    }
    attachmentsMap[att.work_entry_id].push(att);
  });

  // Return proper structure with attachments
  return entries.map(entry => ({
    ...entry,
    attachments: attachmentsMap[entry.id] || [] // Always return array
  }));
}

  /**
   * Find a single work entry by ID with attachments
   */
  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT * FROM work_entries 
      WHERE id = ?
    `, [id]);
    
    if (!rows[0]) return null;

    const [attachments] = await db.execute(`
      SELECT * FROM work_entry_attachments
      WHERE work_entry_id = ?
      ORDER BY upload_date ASC
    `, [id]);

    return {
      ...rows[0],
      attachments
    };
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
   * Delete a work entry by ID (attachments auto-deleted via CASCADE)
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

  /**
   * Add attachment to work entry
   */
  static async addAttachment(workEntryId, attachmentData) {
    const { filename, original_name, mime_type, file_size } = attachmentData;

    const query = `
      INSERT INTO work_entry_attachments 
      (work_entry_id, filename, original_name, mime_type, file_size)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      workEntryId,
      filename,
      original_name,
      mime_type,
      file_size
    ]);

    return {
      id: result.insertId,
      work_entry_id: workEntryId,
      filename,
      original_name,
      mime_type,
      file_size
    };
  }

  /**
   * Get all attachments for a work entry
   */
  static async getAttachments(workEntryId) {
    const [rows] = await db.execute(`
      SELECT * FROM work_entry_attachments
      WHERE work_entry_id = ?
      ORDER BY upload_date ASC
    `, [workEntryId]);
    return rows;
  }

  /**
   * Delete attachment by ID
   */
  static async deleteAttachment(attachmentId, workEntryId) {
    const [result] = await db.execute(
      'DELETE FROM work_entry_attachments WHERE id = ? AND work_entry_id = ?',
      [attachmentId, workEntryId]
    );
    return result;
  }
}

module.exports = WorkEntry;