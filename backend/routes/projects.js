const express = require('express');
const Project = require('../models/Project');
const ClientCompany = require('../models/ClientCompany');
const ClientContact = require('../models/ClientContact');

const router = express.Router();

/**
 * GET all projects with client + contacts
 */
router.get('/', async (req, res) => {
  try {
    const projects = await Project.findAll();

    const projectsWithContacts = await Promise.all(
      projects.map(async (project) => {
        let contacts = [];
        if (project.client_company_id) {
          contacts = await ClientContact.findByCompanyId(project.client_company_id);
        }

        // Transform to match frontend structure
        return {
          id: project.id,
          name: project.project_name,
          projectType: project.project_type,
          department_id: project.department_id,
          department_name: project.department_name,
          projectBrief: project.project_brief,
          startDate: project.start_date,
          finishDate: project.finish_date,
          status: project.status,
          clientDetails: {
            companyName: project.company_name || '',
            address: project.address || '',
            contacts: contacts.map((c) => ({
              name: c.contact_name || '',
              designation: c.designation || '',
              'contact for': c.contact_for || '',
              email: c.email || '',
              phone: c.phone || '',
            })),
          },
        };
      }),
    );

    res.json(projectsWithContacts);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * CREATE project with client + contacts
 */
router.post('/', async (req, res) => {
  try {
    console.log('📦 RAW PROJECT PAYLOAD:\n', JSON.stringify(req.body, null, 2));

    const { clientDetails } = req.body;

    if (!clientDetails || !Array.isArray(clientDetails.contacts)) {
      return res.status(400).json({ error: 'Invalid client details' });
    }

    // ✅ Map frontend field names to backend field names
    const projectData = {
      project_name: req.body.name, // Frontend sends 'name'
      project_type: req.body.projectType, // Frontend sends 'projectType'
      department_id: req.body.department_id,
      project_brief: req.body.projectBrief, // Frontend sends 'projectBrief'
      start_date: req.body.startDate, // Frontend sends 'startDate'
      finish_date: req.body.finishDate, // Frontend sends 'finishDate'
      status: req.body.status,
    };

    // 🔒 Validate required fields
    for (const [key, value] of Object.entries(projectData)) {
      if (value === undefined) {
        throw new Error(`Missing field: ${key}`);
      }
    }

    const company = await ClientCompany.create({
      company_name: clientDetails.companyName,
      address: clientDetails.address,
    });

    await Promise.all(
      clientDetails.contacts.map((contact) =>
        ClientContact.create({
          company_id: company.id,
          contact_name: contact.name,
          designation: contact.designation,
          contact_for: contact['contact for'],
          email: contact.email,
          phone: contact.phone,
        }),
      ),
    );

    const project = await Project.create({
      ...projectData,
      client_company_id: company.id,
    });

    const fullProject = await Project.findById(project.id);
    const contacts = await ClientContact.findByCompanyId(company.id);

    // Transform response to match frontend structure
    const response = {
      id: fullProject.id,
      name: fullProject.project_name,
      projectType: fullProject.project_type,
      department: fullProject.department,
      projectBrief: fullProject.project_brief,
      startDate: fullProject.start_date,
      finishDate: fullProject.finish_date,
      status: fullProject.status,
      clientDetails: {
        companyName: fullProject.company_name || '',
        address: fullProject.address || '',
        contacts: contacts.map((c) => ({
          name: c.contact_name || '',
          designation: c.designation || '',
          'contact for': c.contact_for || '',
          email: c.email || '',
          phone: c.phone || '',
        })),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error(' Add project failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPDATE project
 */
router.put('/:id', async (req, res) => {
  try {
    const { clientDetails, ...projectData } = req.body;

    await Project.update(req.params.id, {
      ...projectData,
      client_company_id: clientDetails?.id || null,
    });

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE project
 */
router.delete('/:id', async (req, res) => {
  try {
    await Project.delete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET projects by department
 */
router.get('/department/:department_id', async (req, res) => {
  try {
    const projects = await Project.findByDepartment(req.params.department_id);

    const projectsWithContacts = await Promise.all(
      projects.map(async (project) => {
        let contacts = [];
        if (project.client_company_id) {
          contacts = await ClientContact.findByCompanyId(project.client_company_id);
        }

        // Transform to match frontend structure
        return {
          id: project.id,
          name: project.project_name,
          projectType: project.project_type,
          department: project.department,
          projectBrief: project.project_brief,
          startDate: project.start_date,
          finishDate: project.finish_date,
          status: project.status,
          clientDetails: {
            companyName: project.company_name || '',
            address: project.address || '',
            contacts: contacts.map((c) => ({
              name: c.contact_name || '',
              designation: c.designation || '',
              'contact for': c.contact_for || '',
              email: c.email || '',
              phone: c.phone || '',
            })),
          },
        };
      }),
    );

    res.json(projectsWithContacts);
  } catch (error) {
    console.error('Get projects by department error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
