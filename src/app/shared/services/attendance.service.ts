import { Injectable } from '@angular/core';

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';

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
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private attendanceRecords: AttendanceRecord[] = [];
  
  constructor() {
    // Initialize with sample data for current user
    this.initializeSampleData();
  }
  
  private initializeSampleData(): void {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayCheckIn = new Date(today);
    todayCheckIn.setHours(9, 15, 0);
    const todayCheckOut = new Date(today);
    todayCheckOut.setHours(17, 45, 0);
    
    const yesterdayCheckIn = new Date(yesterday);
    yesterdayCheckIn.setHours(9, 20, 0);
    const yesterdayCheckOut = new Date(yesterday);
    yesterdayCheckOut.setHours(18, 30, 0);
    
    this.attendanceRecords = [
      {
        id: '1',
        employeeId: '1',
        employeeName: 'Rahul Kumar',
        date: today,
        status: 'present',
        checkInTime: todayCheckIn,
        checkOutTime: todayCheckOut,
        remarks: 'On time',
        workHours: 8.5
      },
      {
        id: '2',
        employeeId: '2',
        employeeName: 'Priya Sharma',
        date: today,
        status: 'present',
        checkInTime: new Date(today.setHours(9, 30)),
        checkOutTime: null,
        remarks: ''
      },
      {
        id: '3',
        employeeId: '1',
        employeeName: 'Rahul Kumar',
        date: yesterday,
        status: 'present',
        checkInTime: yesterdayCheckIn,
        checkOutTime: yesterdayCheckOut,
        remarks: '',
        workHours: 9
      }
    ];
  }
  
  // Get today's attendance for admin view
  getAttendanceByDate(date: Date): AttendanceRecord[] {
    const dateStr = this.formatDate(date);
    
    // Get unique employees for the date
    const records = this.attendanceRecords.filter(record => 
      this.formatDate(record.date) === dateStr
    );
    
    // Group by employee to ensure unique
    const employeeMap = new Map<string, AttendanceRecord>();
    records.forEach(record => {
      employeeMap.set(record.employeeId, record);
    });
    
    return Array.from(employeeMap.values());
  }
  
  // Mark attendance - prevent duplicates
  markAttendance(
    employeeId: string,
    employeeName: string,
    status: AttendanceStatus,
    remarks: string = ''
  ): AttendanceRecord | null {
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    // Check if already marked today
    const existingIndex = this.attendanceRecords.findIndex(record =>
      record.employeeId === employeeId && 
      this.formatDate(record.date) === todayStr
    );
    
    if (existingIndex !== -1) {
      // Update existing record
      this.attendanceRecords[existingIndex].status = status;
      this.attendanceRecords[existingIndex].remarks = remarks;
      this.attendanceRecords[existingIndex].checkInTime = status === 'present' ? new Date() : null;
      this.attendanceRecords[existingIndex].checkOutTime = null;
      return this.attendanceRecords[existingIndex];
    }
    
    // Create new record
    const newRecord: AttendanceRecord = {
      id: this.generateId(),
      employeeId,
      employeeName,
      date: today,
      status,
      checkInTime: status === 'present' ? new Date() : null,
      checkOutTime: null,
      remarks
    };
    
    this.attendanceRecords.push(newRecord);
    return newRecord;
  }
  
  // Checkout - end work day
  checkout(employeeId: string): AttendanceRecord | null {
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    const record = this.attendanceRecords.find(r =>
      r.employeeId === employeeId && 
      this.formatDate(r.date) === todayStr
    );
    
    if (record) {
      record.checkOutTime = new Date();
      if (record.checkInTime) {
        record.workHours = this.calculateWorkHours(record.checkInTime, record.checkOutTime);
      }
      return record;
    }
    
    return null;
  }
  
  // Calculate work hours between check-in and check-out
  private calculateWorkHours(checkIn: Date, checkOut: Date): number {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10; // Round to 1 decimal
  }
  
  // Auto-mark absent after office hours
  autoMarkAbsent(employeeId: string, employeeName: string = ''): void {
    const today = new Date();
    const todayStr = this.formatDate(today);
    const officeEndTime = 18; // 6 PM
    
    const record = this.attendanceRecords.find(r =>
      r.employeeId === employeeId && 
      this.formatDate(r.date) === todayStr
    );
    
    // If no record exists and it's past office hours, mark as absent
    if (!record && today.getHours() >= officeEndTime) {
      const newRecord: AttendanceRecord = {
        id: this.generateId(),
        employeeId,
        employeeName,
        date: today,
        status: 'absent',
        checkInTime: null,
        checkOutTime: null,
        remarks: 'Auto-marked absent',
        workHours: 0
      };
      this.attendanceRecords.push(newRecord);
    }
  }
  
  // Get user's attendance
  getMyAttendance(employeeId: string): AttendanceRecord[] {
    return this.attendanceRecords
      .filter(record => record.employeeId === employeeId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Check if user has marked attendance today
  hasMarkedAttendanceToday(employeeId: string): boolean {
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    return this.attendanceRecords.some(record => 
      record.employeeId === employeeId && 
      this.formatDate(record.date) === todayStr
    );
  }
  
  // Get all attendance (for admin)
  getAllAttendance(): AttendanceRecord[] {
    return [...this.attendanceRecords];
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}