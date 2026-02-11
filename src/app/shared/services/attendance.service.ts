import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private API = 'http://localhost:5000/api/attendance';

  constructor(private http: HttpClient) {}

  // ============ EMPLOYEE APIs ============

  checkIn(employeeId: string): Observable<any> {
    return this.http.post(`${this.API}/check-in`, { employeeId });
  }

  checkOut(employeeId: string): Observable<any> {
    return this.http.post(`${this.API}/check-out`, { employeeId });
  }

  getTodayAttendance(employeeId: string): Observable<any> {
    return this.http.get<any>(`${this.API}/today/${employeeId}`);
  }

  getMyAttendance(employeeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/my/${employeeId}`);
  }

  // ============ ADMIN APIs ============

  getTodayStats(): Observable<any> {
    return this.http.get<any>(`${this.API}/admin/today`);
  }

  getAttendanceByDate(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/admin/date/${date}`);
  }

  getMonthlyAnalytics(month: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/admin/monthly/${month}`);
  }
}
