const db = require('../config/database');

class ProjectAssignment {
  static async findByDepartment(departmentId) {
    const query = `
      SELECT 
        pa.id AS assignment_id,
        pa.project_id,
        p.project_name,
        pa.employee_id,
        e.name AS employee_name,
        e.position AS employee_position,
        p.department_id,
        d.name AS department_name,
        pa.assigned_at
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      JOIN employees e ON pa.employee_id = e.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.department_id = ?
      ORDER BY pa.assigned_at DESC, pa.id DESC
    `;

    const [rows] = await db.execute(query, [departmentId]);
    return rows;
  }

  static async findByProject(projectId) {
    const query = `
      SELECT 
        pa.id AS assignment_id,
        pa.project_id,
        p.project_name,
        pa.employee_id,
        e.name AS employee_name,
        e.position AS employee_position,
        p.department_id,
        d.name AS department_name,
        pa.assigned_at
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      JOIN employees e ON pa.employee_id = e.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE pa.project_id = ?
      ORDER BY pa.assigned_at DESC, pa.id DESC
    `;

    const [rows] = await db.execute(query, [projectId]);
    return rows;
  }

  // ✅ NEW METHOD: Find all assignments for a specific employee
  static async findByEmployee(employeeId) {
    const query = `
      SELECT 
        pa.id AS assignment_id,
        pa.project_id,
        p.project_name,
        pa.employee_id,
        e.name AS employee_name,
        e.position AS employee_position,
        p.department_id,
        d.name AS department_name,
        pa.assigned_at
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      JOIN employees e ON pa.employee_id = e.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE pa.employee_id = ?
      ORDER BY pa.assigned_at DESC, pa.id DESC
    `;

    const [rows] = await db.execute(query, [employeeId]);
    return rows;
  }

  static async replaceForProject(projectId, employeeIds) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [projects] = await connection.execute(
        'SELECT id, department_id FROM projects WHERE id = ?',
        [projectId]
      );

      if (projects.length === 0) {
        throw new Error('Project not found');
      }

      const projectDepartmentId = projects[0].department_id;

      if (!Array.isArray(employeeIds)) {
        throw new Error('employee_ids must be an array');
      }

      const uniqueEmployeeIds = [...new Set(employeeIds.map((id) => Number(id)))].filter(
        (id) => !Number.isNaN(id)
      );

      if (uniqueEmployeeIds.length === 0) {
        await connection.execute(
          'DELETE FROM project_assignments WHERE project_id = ?',
          [projectId]
        );
        await connection.commit();
        return [];
      }

      const [employees] = await connection.query(
        'SELECT id FROM employees WHERE id IN (?) AND department_id = ?',
        [uniqueEmployeeIds, projectDepartmentId]
      );

      if (employees.length !== uniqueEmployeeIds.length) {
        throw new Error('Employees must belong to the same department as the project');
      }

      await connection.execute(
        'DELETE FROM project_assignments WHERE project_id = ?',
        [projectId]
      );

      const values = uniqueEmployeeIds.map((employeeId) => [projectId, employeeId]);
      await connection.query(
        'INSERT INTO project_assignments (project_id, employee_id) VALUES ?',
        [values]
      );

      await connection.commit();
      return await this.findByProject(projectId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createBulk(projectId, employeeIds) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [projects] = await connection.execute(
        'SELECT id, department_id FROM projects WHERE id = ?',
        [projectId]
      );

      if (projects.length === 0) {
        throw new Error('Project not found');
      }

      const projectDepartmentId = projects[0].department_id;

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        throw new Error('employee_ids must be a non-empty array');
      }

      const uniqueEmployeeIds = [...new Set(employeeIds.map((id) => Number(id)))].filter(
        (id) => !Number.isNaN(id)
      );

      if (uniqueEmployeeIds.length === 0) {
        throw new Error('employee_ids must be a non-empty array');
      }

      const [employees] = await connection.query(
        'SELECT id FROM employees WHERE id IN (?) AND department_id = ?',
        [uniqueEmployeeIds, projectDepartmentId]
      );

      if (employees.length !== uniqueEmployeeIds.length) {
        throw new Error('Employees must belong to the same department as the project');
      }

      const values = uniqueEmployeeIds.map((employeeId) => [projectId, employeeId]);
      await connection.query(
        'INSERT INTO project_assignments (project_id, employee_id) VALUES ?',
        [values]
      );

      await connection.commit();
      return await this.findByProject(projectId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ProjectAssignment;