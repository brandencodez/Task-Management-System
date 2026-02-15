const db = require('../config/database');

class ProjectInterest {
  /**
   * Save or update employee's interest in a project
   * @param {Object} interestData - { project_id, employee_id, employee_name, interest_status }
   * @returns {Object} Created/updated interest record
   */
  static async saveInterest(interestData) {
    const { project_id, employee_id, employee_name, interest_status } = interestData;

    // Validate required fields
    if (!project_id || !employee_id || !employee_name || !interest_status) {
      throw new Error('Missing required fields: project_id, employee_id, employee_name, interest_status');
    }

    // Validate interest_status
    if (!['yes', 'no'].includes(interest_status)) {
      throw new Error('Invalid interest status. Must be "yes" or "no"');
    }

    // Validate project exists
    const [project] = await db.execute(
      'SELECT id FROM projects WHERE id = ?',
      [project_id]
    );
    if (project.length === 0) {
      throw new Error('Project not found');
    }

    // Validate employee exists
    const [employee] = await db.execute(
      'SELECT id FROM employees WHERE id = ?',
      [employee_id]
    );
    if (employee.length === 0) {
      throw new Error('Employee not found');
    }

    // Check if interest record already exists
    const [existing] = await db.execute(
      'SELECT id FROM project_interests WHERE project_id = ? AND employee_id = ?',
      [project_id, employee_id]
    );

    let result;

    if (existing.length > 0) {
      // Update existing record
      await db.execute(
        `UPDATE project_interests 
         SET interest_status = ?, employee_name = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE project_id = ? AND employee_id = ?`,
        [interest_status, employee_name, project_id, employee_id]
      );

      result = {
        id: existing[0].id,
        project_id,
        employee_id,
        employee_name,
        interest_status,
        message: 'Interest updated successfully'
      };
    } else {
      // Create new record
      const [insertResult] = await db.execute(
        `INSERT INTO project_interests (project_id, employee_id, employee_name, interest_status)
         VALUES (?, ?, ?, ?)`,
        [project_id, employee_id, employee_name, interest_status]
      );

      result = {
        id: insertResult.insertId,
        project_id,
        employee_id,
        employee_name,
        interest_status,
        message: 'Interest saved successfully'
      };
    }

    return result;
  }

  /**
   * Get specific interest for an employee and project
   * @param {number} employeeId 
   * @param {number} projectId 
   * @returns {Object|null} Interest record or null
   */
  static async getInterest(employeeId, projectId) {
    const [rows] = await db.execute(
      `SELECT * FROM project_interests 
       WHERE employee_id = ? AND project_id = ?`,
      [employeeId, projectId]
    );

    return rows[0] || null;
  }

  /**
   * Get all interests for a specific employee
   * @param {number} employeeId 
   * @returns {Array} List of interest records
   */
  static async getEmployeeInterests(employeeId) {
    const [rows] = await db.execute(
      `SELECT 
        pi.*,
        p.project_name AS project_name,
        p.project_type AS project_type,
        p.status AS project_status
       FROM project_interests pi
       LEFT JOIN projects p ON pi.project_id = p.id
       WHERE pi.employee_id = ?
       ORDER BY pi.created_at DESC`,
      [employeeId]
    );

    return rows;
  }

  /**
   * Get all interested candidates for a project (Admin view)
   * @param {number} projectId 
   * @returns {Array} List of interested employees
   */
  static async getInterestedCandidates(projectId) {
    const [rows] = await db.execute(
      `SELECT 
        pi.id,
        pi.project_id,
        pi.employee_id,
        pi.employee_name,
        pi.interest_status,
        pi.created_at,
        pi.updated_at,
        e.email,
        e.phone,
        e.position,
        e.department_id,
        d.name AS department_name
       FROM project_interests pi
       LEFT JOIN employees e ON pi.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE pi.project_id = ? AND pi.interest_status = 'yes'
       ORDER BY pi.created_at DESC`,
      [projectId]
    );

    return rows;
  }

  /**
   * Get interest statistics for a project
   * @param {number} projectId 
   * @returns {Object} Stats object with interested, not_interested, total counts
   */
  static async getProjectStats(projectId) {
    const [rows] = await db.execute(
      `SELECT 
        interest_status,
        COUNT(*) as count
       FROM project_interests
       WHERE project_id = ?
       GROUP BY interest_status`,
      [projectId]
    );

    const stats = {
      interested: 0,
      not_interested: 0,
      total: 0
    };

    rows.forEach(row => {
      if (row.interest_status === 'yes') {
        stats.interested = row.count;
      } else if (row.interest_status === 'no') {
        stats.not_interested = row.count;
      }
    });

    stats.total = stats.interested + stats.not_interested;

    return stats;
  }

  /**
   * Delete an interest record
   * @param {number} employeeId 
   * @param {number} projectId 
   * @returns {Object} Success message
   */
  static async deleteInterest(employeeId, projectId) {
    const [result] = await db.execute(
      'DELETE FROM project_interests WHERE employee_id = ? AND project_id = ?',
      [employeeId, projectId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Interest record not found');
    }

    return { message: 'Interest removed successfully' };
  }

  /**
   * Get all interests for a project (both yes and no)
   * @param {number} projectId 
   * @returns {Array} All interest records for the project
   */
  static async getAllProjectInterests(projectId) {
    const [rows] = await db.execute(
      `SELECT 
        pi.id,
        pi.project_id,
        pi.employee_id,
        pi.employee_name,
        pi.interest_status,
        pi.created_at,
        pi.updated_at,
        e.email,
        e.phone,
        e.position,
        e.department_id,
        d.name AS department_name
       FROM project_interests pi
       LEFT JOIN employees e ON pi.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE pi.project_id = ?
       ORDER BY pi.interest_status DESC, pi.created_at DESC`,
      [projectId]
    );

    return rows;
  }
}

module.exports = ProjectInterest;