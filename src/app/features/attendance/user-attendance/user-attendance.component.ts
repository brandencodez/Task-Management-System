import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceStatus } from '../../../shared/services/attendance.service';

@Component({
  selector: 'app-user-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-attendance.component.html',
  styleUrls: ['./user-attendance.component.css']
})
export class UserAttendanceComponent implements OnInit {
  currentMonth: string = '';
  myAttendance: any[] = [];
  hasMarkedToday: boolean = false;
  attendanceStatus: 'present' | 'absent' | 'half-day' | 'leave' = 'present';
  remarks: string = '';
  
  // Current user info (would come from auth service in real app)
  currentUserId: string = 'user_1';
  currentUserName: string = 'Current User';

  statusOptions = [
    { value: 'present' as AttendanceStatus, label: 'Present', icon: '✅' },
    { value: 'absent' as AttendanceStatus, label: 'Absent', icon: '❌' },
    { value: 'half-day' as AttendanceStatus, label: 'Half Day', icon: '⏰' },
    { value: 'leave' as AttendanceStatus, label: 'Leave', icon: '🏖️' }
  ];

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadMyAttendance();
    this.checkTodayAttendance();
  }

  setCurrentMonth(): void {
    const now = new Date();
    this.currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  loadMyAttendance(): void {
    const allAttendance = this.attendanceService.getAllAttendance();
    this.myAttendance = allAttendance.filter(
      (record: any) => record.employeeId === this.currentUserId
    );
  }

  checkTodayAttendance(): void {
    const today = new Date().toDateString();
    this.hasMarkedToday = this.myAttendance.some(
      (record: any) => new Date(record.date).toDateString() === today
    );
  }

  markAttendance(): void {
    if (!this.attendanceStatus) return;

    this.attendanceService.markAttendance(
      this.currentUserId,
      this.currentUserName,
      this.attendanceStatus,
      this.remarks
    );

    this.hasMarkedToday = true;
    this.remarks = '';
    this.loadMyAttendance();
  }

  get presentCount(): number {
    return this.countByStatus('present');
  }

  get absentCount(): number {
    return this.countByStatus('absent');
  }

  get halfDayCount(): number {
    return this.countByStatus('half-day');
  }

  get leaveCount(): number {
    return this.countByStatus('leave');
  }

  private countByStatus(status: AttendanceStatus): number {
    return this.myAttendance.filter(record => record.status === status).length;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'half-day': return 'status-halfday';
      case 'leave': return 'status-leave';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'half-day': return '⏰';
      case 'leave': return '🏖️';
      default: return '❓';
    }
  }
}