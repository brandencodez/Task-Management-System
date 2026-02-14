

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectInterest {
  id?: number;
  project_id: number;
  employee_id: number;
  employee_name: string;
  interest_status: 'yes' | 'no';
  created_at?: string;
  updated_at?: string;
  department_name?: string;
  email?: string;
  phone?: string;
}

export interface ProjectInterestStats {
  interested: number;
  not_interested: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectInterestService {
  private apiUrl = 'http://localhost:5000/api/project-interests';

  constructor(private http: HttpClient) {}

  // Save or update employee's interest in a project
  saveInterest(interest: ProjectInterest): Observable<any> {
    return this.http.post(this.apiUrl, interest);
  }

  // Get specific interest for an employee and project
  getInterest(employeeId: number, projectId: number): Observable<ProjectInterest> {
    return this.http.get<ProjectInterest>(
      `${this.apiUrl}/employee/${employeeId}/project/${projectId}`
    );
  }

  // Get all interests for a specific employee
  getEmployeeInterests(employeeId: number): Observable<ProjectInterest[]> {
    return this.http.get<ProjectInterest[]>(
      `${this.apiUrl}/employee/${employeeId}`
    );
  }

  // Get all interested candidates for a project (Admin view)
  getInterestedCandidates(projectId: number): Observable<ProjectInterest[]> {
    return this.http.get<ProjectInterest[]>(
      `${this.apiUrl}/project/${projectId}/interested`
    );
  }

  // Get interest statistics for a project
  getProjectStats(projectId: number): Observable<ProjectInterestStats> {
    return this.http.get<ProjectInterestStats>(
      `${this.apiUrl}/project/${projectId}/stats`
    );
  }

  // Remove interest record
  removeInterest(employeeId: number, projectId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/employee/${employeeId}/project/${projectId}`
    );
  }
}