import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; 
import { WorkEntry, WorkEntryAttachment } from '../models/work-entry.model';

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

  getWorkSummary(): Observable<WorkEntryStatsToday> {
    const params = new HttpParams().set('t', Date.now().toString());
    return this.http.get<WorkEntryStatsToday>(`${this.apiUrl}/summary`, { params });
  }

  getEntries(employeeId: string): Observable<WorkEntry[]> {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.get<WorkEntry[]>(this.apiUrl, { params }).pipe(
      map((entries: WorkEntry[]) => entries.map(entry => ({
        ...entry,
        attachments: entry.attachments || []
      })))
    );
  }

  createEntryWithAttachments(formData: FormData): Observable<WorkEntry> {
    const employeeId = formData.get('employeeId') as string;
    return this.http.post<WorkEntry>(this.apiUrl, formData, {
      params: new HttpParams().set('employeeId', employeeId)
    });
  }

  deleteEntry(id: number, employeeId: string): Observable<void> {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }

  updateEntry(id: number, entry: WorkEntry & { employeeId: string }): Observable<WorkEntry> {
    return this.http.put<WorkEntry>(`${this.apiUrl}/${id}`, entry, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  getAttachmentUrl(filename: string): string {
    return `http://localhost:5000/uploads/work-entries/${filename}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}