/*
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceStatus } from '../../../shared/services/attendance.service';
import { UserService } from '../../../shared/services/user.service';
import { EmployeeService } from '../../employees/employee.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-attendance.component.html',
  styleUrls: ['./user-attendance.component.css']
})
export class UserAttendanceComponent implements OnInit, OnDestroy {
  currentMonth: string = '';
  myAttendance: any[] = [];
  hasMarkedToday: boolean = false;
  hasCheckedOutToday: boolean = false;
  attendanceStatus: AttendanceStatus = 'present';
  remarks: string = '';
  todayRecord: any = null;
  isCheckedInToday: boolean = false;
  
  // Current user info (synchronized with employee data)
  currentUserId: string = '';
  currentUserName: string = '';

  private subscriptions: Subscription[] = [];

  statusOptions = [
    { value: 'present' as AttendanceStatus, label: 'Present', icon: '✅' },
    { value: 'absent' as AttendanceStatus, label: 'Absent', icon: '❌' },
    { value: 'half-day' as AttendanceStatus, label: 'Half Day', icon: '⏰' },
    { value: 'leave' as AttendanceStatus, label: 'Leave', icon: '🏖️' }
  ];

  constructor(
    private attendanceService: AttendanceService,
    private userService: UserService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadCurrentUser();
    this.loadMyAttendance();
    this.checkTodayAttendance();

    this.subscriptions.push(
      this.attendanceService.attendance$.subscribe(() => {
        this.loadMyAttendance();
        this.checkTodayAttendance();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setCurrentMonth(): void {
    const now = new Date();
    this.currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private loadCurrentUser(): void {
    const currentUser = this.userService.getCurrentUser();
    const employees = this.employeeService.getEmployees();

    if (currentUser && employees.length) {
      const employee = employees.find((emp: any) =>
        emp.name.toLowerCase() === currentUser.toLowerCase()
      );

      if (employee) {
        this.currentUserId = employee.id;
        this.currentUserName = employee.name;
        return;
      }
    }

    // Fallback to first employee if no user is logged in
    if (employees.length) {
      this.currentUserId = employees[0].id;
      this.currentUserName = employees[0].name;
    }
  }

  loadMyAttendance(): void {
    if (!this.currentUserId) return;
    this.myAttendance = this.attendanceService.getMyAttendance(this.currentUserId);
  }

  checkTodayAttendance(): void {
    if (!this.currentUserId) {
      this.todayRecord = null;
      this.hasMarkedToday = false;
      this.hasCheckedOutToday = false;
      this.isCheckedInToday = false;
      return;
    }
    this.todayRecord = this.attendanceService.getAttendanceByEmployeeAndDate(
      this.currentUserId,
      new Date()
    );
    
    if (this.todayRecord) {
      this.hasMarkedToday = true;
      this.hasCheckedOutToday = !!this.todayRecord.checkOutTime;
      this.isCheckedInToday = !!this.todayRecord.checkInTime;
    } else {
      this.hasMarkedToday = false;
      this.hasCheckedOutToday = false;
      this.isCheckedInToday = false;
    }
  }

  markAttendance(): void {
    if (!this.attendanceStatus || !this.currentUserId) return;

    const shouldCheckIn = this.attendanceStatus === 'present' || this.attendanceStatus === 'half-day';
    const now = new Date();
    const inTime = shouldCheckIn ? this.formatTime(now) : undefined;

    this.attendanceService.markAttendance(
      this.currentUserId,
      this.currentUserName,
      this.attendanceStatus,
      this.remarks,
      inTime
    );

    this.hasMarkedToday = true;
    this.remarks = '';
    this.loadMyAttendance();
    this.checkTodayAttendance();
  }

  checkout(): void {
    if (!this.todayRecord) return;

    const now = new Date();
    const outTime = this.formatTime(now);
    const inTime = this.todayRecord.inTime || (this.todayRecord.checkInTime ? this.formatTime(new Date(this.todayRecord.checkInTime)) : undefined);

    this.attendanceService.markAttendance(
      this.currentUserId,
      this.currentUserName,
      this.todayRecord.status,
      this.todayRecord.remarks,
      inTime,
      outTime,
      this.todayRecord.workDetails
    );
    
    this.hasCheckedOutToday = true;
    this.loadMyAttendance();
    this.checkTodayAttendance();
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

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
  */