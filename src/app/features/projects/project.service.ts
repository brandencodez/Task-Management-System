import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
    return this.http.get<Project[]>(`${this.apiUrl}/projects`).pipe(
      catchError(error => {
        console.error('Get projects error:', error);
        return of([]);
      })
    );
  }

  addProject(project: Project): Observable<Project> {
    return this.http.post<Project>(
      `${this.apiUrl}/projects`,
      project,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Add project error:', error);
        throw error;
      })
    );
  }

  updateProject(updatedProject: Project): Observable<Project> {
    return this.http.put<Project>(
      `${this.apiUrl}/projects/${updatedProject.id}`,
      updatedProject,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Update project error:', error);
        throw error;
      })
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`).pipe(
      catchError(error => {
        console.error('Delete project error:', error);
        throw error;
      })
    );
  }

  getProjectsByStatus(status: ProjectStatus): Observable<Project[]> {
    return this.getProjects().pipe(
      map(projects => projects.filter(project => project.status === status))
    );
  }
}