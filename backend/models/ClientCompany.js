const db = require('../config/database');

class ClientCompany {
  static async create(companyData) {
    const { company_name, address } = companyData;
    const query = 'INSERT INTO client_companies (company_name, address) VALUES (?, ?)';
    const [result] = await db.execute(query, [company_name, address]);
    return { id: result.insertId, ...companyData };
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM client_companies WHERE id = ?', [id]);
    return rows[0];
  }

  static async update(id, companyData) {
    const { company_name, address } = companyData;
    const query = 'UPDATE client_companies SET company_name = ?, address = ? WHERE id = ?';
    await db.execute(query, [company_name, address, id]);
    return { id, ...companyData };
  }

  static async delete(id) {
    await db.execute('DELETE FROM client_companies WHERE id = ?', [id]);
  }
}

module.exports = ClientCompany;