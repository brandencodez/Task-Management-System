import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-attendance.component.html',
  styleUrls: ['./user-attendance.component.css']
})
export class UserAttendanceComponent implements OnInit {

  todayRecord: any = null;
  
  // Check-in/out status
  hasMarkedToday = false;
  hasCheckedOutToday = false;

  // User info
  currentUserName = '';
  currentMonth = '';

  // Attendance counts
  presentCount = 0;
  absentCount = 0;
  halfDayCount = 0;
  leaveCount = 0;

  // Form data
  attendanceStatus: 'present' | 'absent' | 'half-day' | 'leave' = 'present';

  // Status options for the UI
  statusOptions = [
    { value: 'present' as const, label: 'Present', icon: '✅' },
    { value: 'half-day' as const, label: 'Half Day', icon: '⏰' },
    { value: 'absent' as const, label: 'Absent', icon: '❌' },
    { value: 'leave' as const, label: 'On Leave', icon: '🏖️' }
  ];

  // Attendance history
  myAttendance: any[] = [];

  constructor(
    private http: HttpClient,
    private attendanceService: AttendanceService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeUserData();
    this.loadTodayStatus();
    this.loadMonthlyStats();
    this.loadAttendanceHistory();
  }

  private initializeUserData() {
    const userName = this.userService.getCurrentUser();
    if (userName) {
      this.currentUserName = userName;
    }
    
    // Set current month
    const now = new Date();
    this.currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    this.cdr.detectChanges();
  }

  private getUserIdentifier(): string | null {
    // Try to get employee ID first, fallback to name
    return this.userService.getCurrentUserId() || this.userService.getCurrentUser();
  }

  private loadTodayStatus() {
    const userId = this.getUserIdentifier();
    if (!userId) return;

    this.attendanceService.getTodayAttendance(userId)
      .subscribe({
        next: (record) => {
          console.log('Today\'s attendance record:', record); // Debug log
          this.todayRecord = record;
          this.hasMarkedToday = !!record;
          this.hasCheckedOutToday = !!record?.out_time || !!record?.checkOutTime;
          
          if (record?.status) {
            this.attendanceStatus = record.status;
          }
          
          // Manually trigger change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading today status:', err);
        }
      });
  }

  private loadMonthlyStats() {
    const userId = this.getUserIdentifier();
    if (!userId) return;

    const currentMonth = new Date().toISOString().slice(0, 7);

    this.attendanceService.getMonthlyAnalytics(currentMonth)
      .subscribe({
        next: (data) => {
          // Try to match by ID first, then by name
          const userIdNum = parseInt(userId);
          const myData = data.find((d: any) => 
            d.employeeId === userIdNum || 
            d.employeeId === userId ||
            d.employeeName === this.currentUserName
          );
          
          if (myData) {
            this.presentCount = myData.totalPresent || 0;
            this.absentCount = myData.totalAbsent || 0;
            this.halfDayCount = myData.totalHalfDays || 0;
            this.leaveCount = myData.totalLeaves || 0;
          }
          
          // Manually trigger change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading monthly stats:', err);
        }
      });
  }

  private loadAttendanceHistory() {
    const userId = this.getUserIdentifier();
    if (!userId) return;

    this.attendanceService.getMyAttendance(userId)
      .subscribe({
        next: (records) => {
          console.log('Attendance history records:', records); // Debug log
          this.myAttendance = records
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
          
          // Manually trigger change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading history:', err);
        }
      });
  }

  // Set attendance status (needed for template)
  setAttendanceStatus(status: 'present' | 'absent' | 'half-day' | 'leave') {
    this.attendanceStatus = status;
    this.cdr.detectChanges();
  }

  // Mark attendance
  markAttendance() {
    const userId = this.getUserIdentifier();
    if (!userId) {
      alert('User not logged in');
      return;
    }

    const attendanceData = {
      employeeId: userId,
      status: this.attendanceStatus
    };

    this.http.post(`http://localhost:5000/api/attendance/check-in`, attendanceData)
      .subscribe({
        next: () => {
          alert('Attendance marked successfully!');
          // Reload all data
          this.loadTodayStatus();
          this.loadMonthlyStats();
          this.loadAttendanceHistory();
          
          // Force change detection after all updates
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error checking in:', err);
          alert(err.error?.details || 'Failed to mark attendance. Please try again.');
        }
      });
  }

  // Check out
  checkOut() {
    const userId = this.getUserIdentifier();
    if (!userId) return;

    this.attendanceService.checkOut(userId).subscribe({
      next: () => {
        alert('Checked out successfully!');
        this.loadTodayStatus();
        
        // Force change detection
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error checking out:', err);
        alert('Failed to check out. Please try again.');
      }
    });
  }

  // Helper method for status color classes
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'present': 'status-present',
      'absent': 'status-absent',
      'half-day': 'status-halfday',
      'leave': 'status-leave',
      'not-marked': 'status-pending'
    };
    return colorMap[status] || 'status-pending';
  }

  // Format time string from "HH:mm:ss" to "h:mm AM/PM"
  formatTime(timeString: string | null): string {
    if (!timeString) return '—';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${period}`;
  }
}
  