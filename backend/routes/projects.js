const express = require('express');
const Project = require('../models/Project');
const ClientCompany = require('../models/ClientCompany');
const ClientContact = require('../models/ClientContact');
const router = express.Router();

// Get all projects with client details
router.get('/', async (req, res) => {
  try {
    const projects = await Project.findAll();
    
    // Add contacts to each project
    const projectsWithContacts = await Promise.all(
      projects.map(async (project) => {
        if (project.client_company_id) {
          const contacts = await ClientContact.findByCompanyId(project.client_company_id);
          return { ...project, contacts };
        }
        return { ...project, contacts: [] };
      })
    );
    
    res.json(projectsWithContacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project with client company and contacts
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { clientDetails, ...projectData } = req.body;
    
    // Create client company
    const company = await ClientCompany.create({
      company_name: clientDetails.companyName,
      address: clientDetails.address
    });

    // Create contacts
    const contactPromises = clientDetails.contacts.map(contact =>
      ClientContact.create({
        company_id: company.id,
        contact_name: contact.name,
        designation: contact.designation,
        contact_for: contact['contact for'],
        email: contact.email,
        phone: contact.phone
      })
    );
    await Promise.all(contactPromises);

    // Create project
    const project = await Project.create({
      ...projectData,
      client_company_id: company.id
    });

    await connection.commit();
    
    // Return full project with client details
    const fullProject = await Project.findById(project.id);
    const contacts = await ClientContact.findByCompanyId(fullProject.client_company_id);
    
    res.status(201).json({ ...fullProject, contacts });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Update project
router.put('/:id', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { clientDetails, ...projectData } = req.body;
    
    // Update client company
    await ClientCompany.update(clientDetails.id, {
      company_name: clientDetails.companyName,
      address: clientDetails.address
    });

    // Delete existing contacts and create new ones
    await ClientContact.deleteByCompanyId(clientDetails.id);
    const contactPromises = clientDetails.contacts.map(contact =>
      ClientContact.create({
        company_id: clientDetails.id,
        contact_name: contact.name,
        designation: contact.designation,
        contact_for: contact['contact for'],
        email: contact.email,
        phone: contact.phone
      })
    );
    await Promise.all(contactPromises);

    // Update project
    const project = await Project.update(req.params.id, {
      ...projectData,
      client_company_id: clientDetails.id
    });

    await connection.commit();
    
    // Return updated project
    const fullProject = await Project.findById(project.id);
    const contacts = await ClientContact.findByCompanyId(fullProject.client_company_id);
    
    res.json({ ...fullProject, contacts });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    await Project.delete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get projects by department
router.get('/department/:department', async (req, res) => {
  try {
    const projects = await Project.findByDepartment(req.params.department);
    
    // Add contacts to each project
    const projectsWithContacts = await Promise.all(
      projects.map(async (project) => {
        if (project.client_company_id) {
          const contacts = await ClientContact.findByCompanyId(project.client_company_id);
          return { ...project, contacts };
        }
        return { ...project, contacts: [] };
      })
    );
    
    res.json(projectsWithContacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;