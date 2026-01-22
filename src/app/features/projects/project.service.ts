import { Injectable } from '@angular/core';
import { Project, ProjectStatus } from '../../shared/models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private storageKey = 'projects';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  getProjects(): Project[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  addProject(project: Project) {
    const projects = this.getProjects();
    projects.push(project);
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  
  updateProject(updatedProject: Project) {
    const projects = this.getProjects().map(proj =>
      proj.id === updatedProject.id ? updatedProject : proj
    );
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  deleteProject(id: number) {
    const projects = this.getProjects().filter(proj => proj.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
  }

  getProjectsByStatus(status: ProjectStatus): Project[] {
    return this.getProjects().filter(project => project.status === status);
  }
}