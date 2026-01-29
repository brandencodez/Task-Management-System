const db = require('../config/database');

class ClientContact {
  static async create(contactData) {
    const { 
      company_id, contact_name, designation, 
      contact_for, email, phone 
    } = contactData;
    
    const query = `
      INSERT INTO client_contacts 
      (company_id, contact_name, designation, contact_for, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      company_id, contact_name, designation, contact_for, email, phone
    ]);
    
    return { id: result.insertId, ...contactData };
  }

  static async findByCompanyId(companyId) {
    const [rows] = await db.execute('SELECT * FROM client_contacts WHERE company_id = ?', [companyId]);
    return rows;
  }

  static async deleteByCompanyId(companyId) {
    await db.execute('DELETE FROM client_contacts WHERE company_id = ?', [companyId]);
  }
}

module.exports = ClientContact;