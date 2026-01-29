import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; 
import { Employee } from './employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/employees`).pipe(
      catchError(error => {
        console.error('Get employees error:', error);
        return of([]);
      })
    );
  }

  getEmployeeById(id: number): Observable<Employee | undefined> {
    return this.http.get<Employee>(`${this.apiUrl}/employees/${id}`).pipe(
      catchError(error => {
        console.error('Get employee error:', error);
        return of(undefined);
      })
    );
  }

  addEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(
      `${this.apiUrl}/employees`,
      employee,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Add employee error:', error);
        throw error;
      })
    );
  }

  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(
      `${this.apiUrl}/employees/${id}`,
      employee,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Update employee error:', error);
        throw error;
      })
    );
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/employees/${id}`).pipe(
      catchError(error => {
        console.error('Delete employee error:', error);
        throw error;
      })
    );
  }

  searchEmployees(query: string): Observable<Employee[]> {
    return this.getEmployees().pipe(
      map((employees: Employee[]) => { 
        const lowerQuery = query.toLowerCase();
        return employees.filter(emp => 
          emp.name.toLowerCase().includes(lowerQuery) ||
          emp.email.toLowerCase().includes(lowerQuery) ||
          emp.department.toLowerCase().includes(lowerQuery) ||
          emp.position.toLowerCase().includes(lowerQuery)
        );
      })
    );
  }
}