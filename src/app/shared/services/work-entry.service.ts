// src/app/shared/services/work-entry.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkEntry } from '../models/work-entry.model';

@Injectable({ providedIn: 'root' })
export class WorkEntryService {
  private apiUrl = 'http://localhost:5000/api/work-entries';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // Pass employeeId explicitly
  getEntries(employeeId: string): Observable<WorkEntry[]> {
    return this.http.get<WorkEntry[]>(this.apiUrl, {
      params: { employeeId }
    });
  }

  createEntry(entry: WorkEntry & { employeeId: string }): Observable<WorkEntry> {
    return this.http.post<WorkEntry>(this.apiUrl, entry, {
      headers: this.getHeaders()
    });
  }

  deleteEntry(id: number, employeeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}?employeeId=${employeeId}`);
  }

  updateEntry(id: number, entry: WorkEntry & { employeeId: string }): Observable<WorkEntry> {
    return this.http.put<WorkEntry>(`${this.apiUrl}/${id}`, entry, {
      headers: this.getHeaders()
    });
  }
}