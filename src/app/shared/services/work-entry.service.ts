import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkEntry } from '../models/work-entry.model';

export interface EmployeeWithDepartment {
  name: string;
  department: string;
}

export interface WorkEntryStatsToday {
  totalActiveEmployees: number;
  submittedToday: number;
  notSubmittedToday: number;
  employeesWithEntries: EmployeeWithDepartment[];
  employeesWithoutEntries: EmployeeWithDepartment[];
}

@Injectable({ providedIn: 'root' })
export class WorkEntryService {
  private apiUrl = 'http://localhost:5000/api/work-entries';

  constructor(private http: HttpClient) {}

  /**
   * Get work entry summary for today
   * Uses cache-busting to force fresh data
   */
  getWorkSummary(): Observable<WorkEntryStatsToday> {
    const params = new HttpParams().set('t', Date.now().toString());
    return this.http.get<WorkEntryStatsToday>(`${this.apiUrl}/summary`, { params });
  }

  /**
   * Get all work entries for a specific employee
   * @param employeeId - The ID of the employee
   */
  getEntries(employeeId: string): Observable<WorkEntry[]> {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.get<WorkEntry[]>(this.apiUrl, { params });
  }

  /**
   * Create a new work entry with attachment
   */
  createEntry(formData: FormData): Observable<WorkEntry> {
    return this.http.post<WorkEntry>(this.apiUrl, formData);
  }

  /**
   * Delete a work entry by ID
   */
  deleteEntry(id: number, employeeId: string): Observable<void> {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }

  /**
   * Update an existing work entry
   */
  updateEntry(id: number, entry: WorkEntry & { employeeId: string }): Observable<WorkEntry> {
    return this.http.put<WorkEntry>(`${this.apiUrl}/${id}`, entry, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  /**
   * Get attachment URL for download
   */
  getAttachmentUrl(filename: string): string {
    return `http://localhost:5000/uploads/work-entries/${filename}`;
  }
}