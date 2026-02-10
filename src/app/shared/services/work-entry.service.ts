import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkEntry } from '../models/work-entry.model';

export interface WorkEntryStatsToday {
  totalActiveEmployees: number;
  submittedToday: number;
  notSubmittedToday: number;
  submittedPercentage: number;
  employeesWithEntries: string[];
  employeesWithoutEntries: string[];
}

@Injectable({ providedIn: 'root' })
export class WorkEntryService {
  private apiUrl = 'http://localhost:5000/api/work-entries';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // cache-busting to force fresh data
  getWorkSummary(): Observable<WorkEntryStatsToday> {
    const params = new HttpParams().set('t', Date.now().toString());
    return this.http.get<WorkEntryStatsToday>(`${this.apiUrl}/summary`, { params });
  }

  // Pass employeeId explicitly
  getEntries(employeeId: string): Observable<WorkEntry[]> {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.get<WorkEntry[]>(this.apiUrl, { params });
  }

  createEntry(entry: WorkEntry & { employeeId: string }): Observable<WorkEntry> {
    return this.http.post<WorkEntry>(this.apiUrl, entry, {
      headers: this.getHeaders()
    });
  }

  deleteEntry(id: number, employeeId: string): Observable<void> {
    const params = new HttpParams().set('employeeId', employeeId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }

  updateEntry(id: number, entry: WorkEntry & { employeeId: string }): Observable<WorkEntry> {
    return this.http.put<WorkEntry>(`${this.apiUrl}/${id}`, entry, {
      headers: this.getHeaders()
    });
  }
}