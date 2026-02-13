import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private API = 'http://localhost:5000/api/attendance';
  private LEAVE_API = 'http://localhost:5000/api/leave-requests'; // Separate leave API endpoint

  constructor(private http: HttpClient) {}

  // ============ EMPLOYEE APIs ============

  checkIn(employeeId: string, status: string = 'present'): Observable<any> {
    return this.http.post(`${this.API}/check-in`, { employeeId, status });
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

  // ============ LEAVE REQUEST APIs ============

  /**
   * Apply for leave (creates pending leave request)
   * @param data { employeeId: string, date: string, reason: string }
   */
  applyLeave(data: { employeeId: string; date: string; reason: string }): Observable<any> {
    return this.http.post(`${this.LEAVE_API}/request`, data);
  }

  /**
   * Get all pending leave requests (Admin only)
   * This is the method admin component should use
   */
  getPendingLeaves(): Observable<any[]> {
    return this.http.get<any[]>(`${this.LEAVE_API}/admin/pending`);
  }

  /**
   * Approve a leave request (Admin only)
   * @param id Leave request ID
   */
  approveLeave(id: number): Observable<any> {
    return this.http.post(`${this.LEAVE_API}/admin/approve/${id}`, {});
  }

  /**
   * Reject a leave request (Admin only)
   * @param id Leave request ID
   */
  rejectLeave(id: number): Observable<any> {
    return this.http.post(`${this.LEAVE_API}/admin/reject/${id}`, {});
  }

  /**
   * Legacy method - kept for backwards compatibility
   * @deprecated Use getPendingLeaves() instead
   */
  getLeaveRequests(): Observable<any[]> {
    return this.getPendingLeaves();
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