<<<<<<< HEAD
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
=======
import { Injectable } from '@angular/core';
import { WorkEntry } from '../models/work-entry.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkEntryService {
  private storageKey = 'work_entries';
  private workEntries: WorkEntry[] = [];
  private workEntriesSubject = new BehaviorSubject<WorkEntry[]>([]);
  
  public workEntries$ = this.workEntriesSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedData = localStorage.getItem(this.storageKey);
    if (storedData) {
      this.workEntries = JSON.parse(storedData);
    }
    this.workEntriesSubject.next([...this.workEntries]);
  }

  private saveToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.workEntries));
    this.workEntriesSubject.next([...this.workEntries]);
  }

  /**
   * Get all work entries
   */
  getAll(): WorkEntry[] {
    return [...this.workEntries];
  }

  /**
   * Get work entries by employee
   */
  getByEmployeeId(employeeId: string): WorkEntry[] {
    return this.workEntries.filter(entry => entry.employeeId === employeeId);
  }

  /**
   * Get work entries by date
   */
  getByDate(date: string): WorkEntry[] {
    return this.workEntries.filter(entry => entry.date === date);
  }

  /**
   * Get work entries by employee and date
   */
  getByEmployeeAndDate(employeeId: string, date: string): WorkEntry[] {
    return this.workEntries.filter(
      entry => entry.employeeId === employeeId && entry.date === date
    );
  }

  /**
   * Get work entries in a date range
   */
  getByDateRange(startDate: string, endDate: string): WorkEntry[] {
    return this.workEntries.filter(
      entry => entry.date >= startDate && entry.date <= endDate
    );
  }

  /**
   * Get work entries for employee in a date range
   */
  getByEmployeeAndDateRange(
    employeeId: string,
    startDate: string,
    endDate: string
  ): WorkEntry[] {
    return this.workEntries.filter(
      entry =>
        entry.employeeId === employeeId &&
        entry.date >= startDate &&
        entry.date <= endDate
    );
  }

  /**
   * Add a new work entry
   */
  add(entry: Omit<WorkEntry, 'id' | 'createdAt' | 'updatedAt'>): WorkEntry {
    const newEntry: WorkEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.workEntries.push(newEntry);
    this.saveToStorage();
    return newEntry;
  }

  /**
   * Update an existing work entry
   */
  update(id: string, entry: Partial<WorkEntry>): WorkEntry | null {
    const index = this.workEntries.findIndex(e => e.id === id);
    if (index === -1) {
      return null;
    }
    
    this.workEntries[index] = {
      ...this.workEntries[index],
      ...entry,
      id: this.workEntries[index].id, // Prevent ID change
      createdAt: this.workEntries[index].createdAt, // Prevent creation date change
      updatedAt: new Date()
    };
    this.saveToStorage();
    return this.workEntries[index];
  }

  /**
   * Delete a work entry
   */
  delete(id: string): boolean {
    const index = this.workEntries.findIndex(e => e.id === id);
    if (index === -1) {
      return false;
    }
    this.workEntries.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * Get total work hours for an employee on a specific date
   */
  getTotalHoursByEmployeeAndDate(employeeId: string, date: string): number {
    return this.getByEmployeeAndDate(employeeId, date).reduce(
      (sum, entry) => sum + entry.hours,
      0
    );
  }

  /**
   * Get average progress for an employee on a specific date
   */
  getAverageProgressByEmployeeAndDate(employeeId: string, date: string): number {
    const entries = this.getByEmployeeAndDate(employeeId, date);
    if (entries.length === 0) return 0;
    const totalProgress = entries.reduce((sum, entry) => sum + entry.progress, 0);
    return Math.round(totalProgress / entries.length);
  }

  /**
   * Check if employee has any entries today
   */
  hasEntriesForDate(employeeId: string, date: string): boolean {
    return this.getByEmployeeAndDate(employeeId, date).length > 0;
  }

  /**
   * Get combined work hours and details for employee attendance
   */
  getAttendanceDetails(employeeId: string, date: string): {
    totalHours: number;
    entries: WorkEntry[];
    hasEntries: boolean;
  } {
    const entries = this.getByEmployeeAndDate(employeeId, date);
    return {
      totalHours: entries.reduce((sum, entry) => sum + entry.hours, 0),
      entries: entries,
      hasEntries: entries.length > 0
    };
  }

  private generateId(): string {
    return 'work_' + Math.random().toString(36).substr(2, 9);
  }
}
>>>>>>> adf6076 (update User Attendance)
