import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Reminder } from '../../shared/models/reminder.model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private apiUrl = 'http://localhost:5000/api';
  
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  getReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/reminders`).pipe(
      catchError(error => {
        console.error('Get reminders error:', error);
        return of([]);
      })
    );
  }

  addReminder(reminder: Omit<Reminder, 'id' | 'employee_name'>): Observable<Reminder> {
    return this.http.post<Reminder>(
      `${this.apiUrl}/reminders`,
      reminder,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Add reminder error:', error);
        throw error;
      })
    );
  }

  deleteReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reminders/${id}`).pipe(
      catchError(error => {
        console.error('Delete reminder error:', error);
        throw error;
      })
    );
  }
}