import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  newProject: Partial<Project> = {
    name: '',
    projectType: '',
    clientDetails: '',
    projectBrief: '',
    startDate: '',
    finishDate: '',
    status: 'UPCOMING'
  };
  showAddForm = false;
  statuses: ProjectStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED'];

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projects = this.projectService.getProjects();
  }

  addProject() {
  if (!this.newProject.name || !this.newProject.startDate || !this.newProject.finishDate) {
    alert('Project name, start date, and finish date are required!');
    return;
  }
    if (new Date(this.newProject.finishDate!) < new Date(this.newProject.startDate!)) {
    alert('Finish date must be after start date!');
    return;
  }
    
    const project: Project = {
      id: Date.now(),
      name: this.newProject.name,
      projectType: this.newProject.projectType || '',
      clientDetails: this.newProject.clientDetails || '',
      projectBrief: this.newProject.projectBrief || '',
      startDate: this.newProject.startDate, 
      finishDate: this.newProject.finishDate,
      status: this.newProject.status || 'UPCOMING'
    };

    this.projectService.addProject(project);
    this.resetForm();
    this.loadProjects();
  }

  resetForm() {
    this.newProject = { status: 'UPCOMING' };
    this.showAddForm = false;
  }

  getProjectsByStatus(status: ProjectStatus) {
    return this.projects.filter(p => p.status === status);
  }
}