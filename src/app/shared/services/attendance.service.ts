import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave' | 'not-marked';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  remarks: string;
  workHours?: number;
  workEntries?: any[];
  project?: string;
  inTime?: string;
  outTime?: string;
  workDetails?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private storageKey = 'attendance_records';
  private attendanceRecords: AttendanceRecord[] = [];
  private attendanceSubject = new BehaviorSubject<AttendanceRecord[]>([]);
  
  public attendance$ = this.attendanceSubject.asObservable();
  
  constructor() {
    // Load from storage - no dummy data initialization
    this.loadFromStorage();
  }
  
  private loadFromStorage(): void {
    const storedData = localStorage.getItem(this.storageKey);
    if (storedData) {
      this.attendanceRecords = JSON.parse(storedData).map((record: any) => ({
        ...record,
        date: new Date(record.date),
        checkInTime: record.checkInTime ? new Date(record.checkInTime) : null,
        checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : null
      }));
    }
    this.attendanceSubject.next([...this.attendanceRecords]);
  }

  private saveToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.attendanceRecords));
    this.attendanceSubject.next([...this.attendanceRecords]);
  }
  
  /**
   * Get attendance records for a specific date
   */
  getAttendanceByDate(date: Date): AttendanceRecord[] {
    const dateStr = this.formatDate(date);
    return this.attendanceRecords.filter(record => 
      this.formatDate(record.date) === dateStr
    );
  }

  /**
   * Get attendance records by employee and date
   */
  getAttendanceByEmployeeAndDate(employeeId: string, date: Date): AttendanceRecord | null {
    const dateStr = this.formatDate(date);
    return this.attendanceRecords.find(record =>
      record.employeeId === employeeId && 
      this.formatDate(record.date) === dateStr
    ) || null;
  }
  
  /**
   * Mark or update attendance record
   */
  markAttendance(
    employeeId: string,
    employeeName: string,
    status: AttendanceStatus,
    remarks: string = '',
    inTime?: string,
    outTime?: string,
    workDetails?: string
  ): AttendanceRecord | null {
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    // Check if already marked today
    const existingIndex = this.attendanceRecords.findIndex(record =>
      record.employeeId === employeeId && 
      this.formatDate(record.date) === todayStr
    );
    
    const record: AttendanceRecord = {
      id: existingIndex !== -1 ? this.attendanceRecords[existingIndex].id : this.generateId(),
      employeeId,
      employeeName,
      date: today,
      status,
      checkInTime: inTime ? this.parseTimeToDate(today, inTime) : null,
      checkOutTime: outTime ? this.parseTimeToDate(today, outTime) : null,
      remarks,
      inTime,
      outTime,
      workDetails,
      workHours: inTime && outTime ? this.calculateWorkHoursFromTime(inTime, outTime) : undefined
    };

    if (existingIndex !== -1) {
      this.attendanceRecords[existingIndex] = record;
    } else {
      this.attendanceRecords.push(record);
    }
    
    this.saveToStorage();
    return record;
  }
  
  /**
   * Update attendance with work entry details
   */
  updateAttendanceWithWorkEntry(
    employeeId: string,
    date: string,
    workEntry: any
  ): AttendanceRecord | null {
    const dateObj = new Date(date);
    const dateStr = this.formatDate(dateObj);
    
    const existingIndex = this.attendanceRecords.findIndex(record =>
      record.employeeId === employeeId && 
      this.formatDate(record.date) === dateStr
    );

    const existing = existingIndex !== -1 ? this.attendanceRecords[existingIndex] : null;

    const record: AttendanceRecord = {
      id: existing ? existing.id : this.generateId(),
      employeeId,
      employeeName: existing?.employeeName || '',
      date: dateObj,
      status: existing?.status || 'present',
      checkInTime: existing?.checkInTime || null,
      checkOutTime: existing?.checkOutTime || null,
      remarks: existing?.remarks || workEntry.workDetails || '',
      inTime: existing?.inTime,
      outTime: existing?.outTime,
      workDetails: workEntry.workDetails,
      project: workEntry.project,
      workHours: workEntry.hours || existing?.workHours || 0
    };

    if (existingIndex !== -1) {
      this.attendanceRecords[existingIndex] = record;
    } else {
      this.attendanceRecords.push(record);
    }
    
    this.saveToStorage();
    return record;
  }
  
  /**
   * Get user's attendance history
   */
  getMyAttendance(employeeId: string): AttendanceRecord[] {
    return this.attendanceRecords
      .filter(record => record.employeeId === employeeId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get attendance by date range for employee
   */
  getAttendanceByEmployeeAndDateRange(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): AttendanceRecord[] {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    
    return this.attendanceRecords.filter(record =>
      record.employeeId === employeeId &&
      this.formatDate(record.date) >= start &&
      this.formatDate(record.date) <= end
    );
  }
  
  /**
   * Check if user has marked attendance today
   */
  hasMarkedAttendanceToday(employeeId: string): boolean {
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    return this.attendanceRecords.some(record => 
      record.employeeId === employeeId && 
      this.formatDate(record.date) === todayStr
    );
  }
  
  /**
   * Get all attendance (for admin)
   */
  getAllAttendance(): AttendanceRecord[] {
    return [...this.attendanceRecords];
  }

  /**
   * Get monthly summary for employee
   */
  getMonthlySummary(employeeId: string, month: Date): any {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const records = this.getAttendanceByEmployeeAndDateRange(employeeId, startDate, endDate);
    
    return {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      leave: records.filter(r => r.status === 'leave').length,
      notMarked: records.filter(r => r.status === 'not-marked').length,
      totalHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0)
    };
  }

  /**
   * Parse time string (HH:mm) to Date object
   */
  private parseTimeToDate(date: Date, timeStr: string): Date | null {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0);
    return result;
  }

  /**
   * Calculate work hours between two time strings (HH:mm format)
   */
  private calculateWorkHoursFromTime(inTime: string, outTime: string): number {
    if (!inTime || !outTime) return 0;
    
    const [inHours, inMinutes] = inTime.split(':').map(Number);
    const [outHours, outMinutes] = outTime.split(':').map(Number);
    
    const inTotalMinutes = inHours * 60 + inMinutes;
    const outTotalMinutes = outHours * 60 + outMinutes;
    
    const diffMinutes = outTotalMinutes - inTotalMinutes;
    return Math.round((diffMinutes / 60) * 10) / 10; // Round to 1 decimal
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private generateId(): string {
    return 'att_' + Math.random().toString(36).substr(2, 9);
  }
}