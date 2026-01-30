import { Injectable } from '@angular/core';

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime: Date | null;
  remarks: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private attendanceRecords: AttendanceRecord[] = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'Rahul Kumar',
      date: new Date(),
      status: 'present',
      checkInTime: new Date(),
      remarks: 'On time'
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Priya Sharma',
      date: new Date(),
      status: 'present',
      checkInTime: new Date(),
      remarks: ''
    }
  ];
  
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
      remarks
    };
    
    this.attendanceRecords.push(newRecord);
    return newRecord;
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