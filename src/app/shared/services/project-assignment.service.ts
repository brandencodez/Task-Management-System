import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProjectAssignment } from '../models/project-assignment.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectAssignmentService {
  private apiUrl = 'http://localhost:5000/api/assignments';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getAssignmentsByDepartment(departmentId: number): Observable<ProjectAssignment[]> {
    return this.http.get<ProjectAssignment[]>(`${this.apiUrl}?department_id=${departmentId}`);
  }

  getAssignmentsByProject(projectId: number): Observable<ProjectAssignment[]> {
    return this.http.get<ProjectAssignment[]>(`${this.apiUrl}/project/${projectId}`);
  }

  // ✅ NEW METHOD: Get assignments for a specific employee
  getAssignmentsByEmployee(employeeId: number): Observable<ProjectAssignment[]> {
    return this.http.get<ProjectAssignment[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  replaceAssignments(projectId: number, employeeIds: number[]): Observable<ProjectAssignment[]> {
    return this.http.put<ProjectAssignment[]>(
      `${this.apiUrl}/project/${projectId}`,
      { employee_ids: employeeIds },
      { headers: this.getHeaders() }
    );
  }

  createAssignments(projectId: number, employeeIds: number[]): Observable<ProjectAssignment[]> {
    return this.http.post<ProjectAssignment[]>(
      this.apiUrl,
      { project_id: projectId, employee_ids: employeeIds },
      { headers: this.getHeaders() }
    );
  }
}