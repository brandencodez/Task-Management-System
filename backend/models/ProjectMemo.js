const db = require('../config/database');

class ProjectMemo {
  static async create(memoData) {
    const { projectId, content, createdAt, updatedAt } = memoData;

    const query = `
      INSERT INTO project_memos 
      (project_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      projectId,
      content,
      createdAt || new Date(),
      updatedAt || new Date()
    ]);

    return { id: result.insertId, ...memoData };
  }

  static async findAllByProject(projectId) {
    const query = `
      SELECT id, project_id as projectId, content, created_at as createdAt, updated_at as updatedAt
      FROM project_memos 
      WHERE project_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query, [projectId]);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, project_id as projectId, content, created_at as createdAt, updated_at as updatedAt
      FROM project_memos 
      WHERE id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async update(id, memoData) {
    const { content, updatedAt } = memoData;

    const query = `
      UPDATE project_memos 
      SET content = ?, updated_at = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      content,
      updatedAt || new Date(),
      id
    ]);

    return { id, ...memoData };
  }

  static async delete(id) {
    await db.execute('DELETE FROM project_memos WHERE id = ?', [id]);
  }

  static async deleteByProject(projectId) {
    await db.execute('DELETE FROM project_memos WHERE project_id = ?', [projectId]);
  }

  static async count(projectId) {
    const query = `SELECT COUNT(*) as count FROM project_memos WHERE project_id = ?`;
    const [rows] = await db.execute(query, [projectId]);
    return rows[0].count;
  }
}

module.exports = ProjectMemo;
