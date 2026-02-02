import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, retry, tap } from 'rxjs/operators';
import { Project, ProjectStatus } from '../../shared/models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getProjects(): Observable<Project[]> {
    console.log('📡 Fetching projects from API...');
    
    return this.http.get<Project[]>(`${this.apiUrl}/projects`).pipe(
      // Retry up to 2 times with a 500ms delay between attempts
      // This handles backend cold-start scenarios
      retry({
        count: 2,
        delay: 500
      }),
      tap(projects => {
        console.log('✅ Projects fetched:', projects.length);
      }),
      // Ensure we always return an array
      map(projects => Array.isArray(projects) ? projects : [])
    );
  }

  addProject(project: Project): Observable<Project> {
    console.log('➕ Adding new project:', project.name);
    
    return this.http.post<Project>(
      `${this.apiUrl}/projects`,
      project,
      { headers: this.getHeaders() }
    ).pipe(
      tap(newProject => {
        console.log('✅ Project added successfully:', newProject.id);
      })
    );
  }

  updateProject(updatedProject: Project): Observable<Project> {
    console.log('✏️ Updating project:', updatedProject.id, updatedProject.name);
    
    return this.http.put<Project>(
      `${this.apiUrl}/projects/${updatedProject.id}`,
      updatedProject,
      { headers: this.getHeaders() }
    ).pipe(
      tap(updated => {
        console.log('✅ Project updated successfully:', updated.id);
      })
    );
  }

  deleteProject(id: number): Observable<void> {
    console.log('🗑️ Deleting project:', id);
    
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`).pipe(
      tap(() => {
        console.log('✅ Project deleted successfully:', id);
      })
    );
  }

  getProjectsByStatus(status: ProjectStatus): Observable<Project[]> {
    return this.getProjects().pipe(
      map(projects => projects.filter(project => project.status === status))
    );
  }
}