import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department } from './department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = 'http://localhost:5000/api/departments';

  constructor(private http: HttpClient) {}

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl);
  }

  getActiveDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/active`);
  }

  addDepartment(department: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, department);
  }

  updateDepartment(id: number, department: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${id}`, department);
  }

  disableDepartment(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/disable`, {});
  }

  enableDepartment(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/enable`, {});
  }
}
