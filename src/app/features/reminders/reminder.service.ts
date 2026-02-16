import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Reminder, MeetingNotification } from '../../shared/models/reminder.model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private apiUrl = 'http://localhost:5000/api';

  /** Emits whenever reminders are mutated (create/update/delete/complete/reopen) */
  readonly notificationRefresh$ = new Subject<void>();
  
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
      tap(() => this.notificationRefresh$.next()),
      catchError(error => {
        console.error('Delete reminder error:', error);
        throw error;
      })
    );
  }

  getMyMeetings(employeeId: number): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/reminders/employee/${employeeId}`).pipe(
      catchError(error => {
        console.error('Get my meetings error:', error);
        return of([]);
      })
    );
  }

  markCompleted(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reminders/${id}/complete`, {}).pipe(
      tap(() => this.notificationRefresh$.next()),
      catchError(error => { console.error('Mark completed error:', error); throw error; })
    );
  }

  reopenReminder(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reminders/${id}/reopen`, {}).pipe(
      tap(() => this.notificationRefresh$.next()),
      catchError(error => { console.error('Reopen error:', error); throw error; })
    );
  }

  getNotifications(employeeId: number): Observable<MeetingNotification[]> {
    return this.http.get<MeetingNotification[]>(`${this.apiUrl}/reminders/employee/${employeeId}/notifications`).pipe(
      catchError(error => { console.error('Get notifications error:', error); return of([]); })
    );
  }

  getAllNotifications(): Observable<MeetingNotification[]> {
    return this.http.get<MeetingNotification[]>(`${this.apiUrl}/reminders/notifications/all`).pipe(
      catchError(error => { console.error('Get all notifications error:', error); return of([]); })
    );
  }

  updateReminder(id: number, reminder: Omit<Reminder, 'id' | 'employee_name'>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/reminders/${id}`,
      reminder,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => { console.error('Update reminder error:', error); throw error; })
    );
  }

  dismissNotification(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reminders/${id}/dismiss-notification`, {}).pipe(
      tap(() => this.notificationRefresh$.next()),
      catchError(error => { console.error('Dismiss notification error:', error); throw error; })
    );
  }
}