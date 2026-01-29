const db = require('../config/database');

class Project {
  static async create(projectData) {
    const { 
      project_name, project_type, department, 
      client_company_id, project_brief, start_date, finish_date, status 
    } = projectData;
    
    const query = `
      INSERT INTO projects 
      (project_name, project_type, department, client_company_id, project_brief, start_date, finish_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      project_name, project_type, department, 
      client_company_id, project_brief, start_date, finish_date, status
    ]);
    
    return { id: result.insertId, ...projectData };
  }

  static async findAll() {
    const query = `
      SELECT p.*, cc.company_name, cc.address
      FROM projects p
      LEFT JOIN client_companies cc ON p.client_company_id = cc.id
      ORDER BY p.id
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT p.*, cc.company_name, cc.address
      FROM projects p
      LEFT JOIN client_companies cc ON p.client_company_id = cc.id
      WHERE p.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async update(id, projectData) {
    const { 
      project_name, project_type, department, 
      client_company_id, project_brief, start_date, finish_date, status 
    } = projectData;
    
    const query = `
      UPDATE projects 
      SET project_name = ?, project_type = ?, department = ?, 
          client_company_id = ?, project_brief = ?, start_date = ?, finish_date = ?, status = ?
      WHERE id = ?
    `;
    
    await db.execute(query, [
      project_name, project_type, department, 
      client_company_id, project_brief, start_date, finish_date, status, id
    ]);
    
    return { id, ...projectData };
  }

  static async delete(id) {
    await db.execute('DELETE FROM projects WHERE id = ?', [id]);
  }

  static async findByDepartment(department) {
    const query = `
      SELECT p.*, cc.company_name, cc.address
      FROM projects p
      LEFT JOIN client_companies cc ON p.client_company_id = cc.id
      WHERE p.department = ?
      ORDER BY p.id
    `;
    const [rows] = await db.execute(query, [department]);
    return rows;
  }
}

module.exports = Project;