// admin-attendance.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { EmployeeService } from '../../employees/employee.service';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

interface DailyAttendanceRecord {
  date: string;
  status: string;
  workHours: number;
  overtime: number;
  checkInTime: string | null;
}

interface GroupedLeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  leaveIds: number[];
}

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-attendance.component.html',
  styleUrls: ['./admin-attendance.component.css']
})
export class AdminAttendanceComponent implements OnInit {

  selectedView: 'daily' | 'monthly' | 'leave' = 'daily';
  selectedDate = this.formatDate(new Date());
  selectedMonth = this.formatMonth(new Date());

  attendanceRecords: any[] = [];
  filteredRecords: any[] = []; 
  attendanceSummary: any[] = [];
  allEmployees: any[] = [];
  leaveRequests: any[] = [];
  groupedLeaveRequests: GroupedLeaveRequest[] = [];
  loadingLeaves = false;

  // Today's Overview with all required properties
  todayOverview = {
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    notMarked: 0,
    total: 0
  };

  // Quick Stats
  quickStats = {
    onTime: 0,
    lateComers: 0,
    earlyLeavers: 0
  };

  searchQuery = '';
  statusFilter = 'all';
  departmentFilter = 'all';
  sortBy = 'name';

  // Settings
  autoMarkEnabled = false;
  notificationsEnabled = true;
  officeEndTime = '6:00 PM';
  showSettings = false;

  // Monthly view
  months: Date[] = [];
  expandedEmployeeId: string | null = null;

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {
    this.generateMonthsList();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDailyData();
  }

  // View Management
  onViewChange(view: 'daily' | 'monthly' | 'leave') {
    this.selectedView = view;

    if (view === 'daily') this.loadDailyData();
    if (view === 'monthly') this.loadMonthlyData();
    if (view === 'leave') this.loadLeaveRequests();

    this.cdr.detectChanges();
  }

  loadLeaveRequests() {
    this.loadingLeaves = true;

    this.attendanceService.getPendingLeaves().subscribe({
      next: res => {
        this.leaveRequests = res;
        this.groupedLeaveRequests = this.groupConsecutiveLeaves(res);
        this.loadingLeaves = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Leave load error:', err);
        this.loadingLeaves = false;
      }
    });
  }

  // Group consecutive leave requests
  private groupConsecutiveLeaves(leaves: any[]): GroupedLeaveRequest[] {
    if (!leaves || leaves.length === 0) return [];

    // Sort by employee and date
    const sorted = [...leaves].sort((a, b) => {
      const empCompare = a.employeeId - b.employeeId;
      if (empCompare !== 0) return empCompare;
      return new Date(a.leave_date).getTime() - new Date(b.leave_date).getTime();
    });

    const grouped: GroupedLeaveRequest[] = [];
    let currentGroup: GroupedLeaveRequest | null = null;

    sorted.forEach(leave => {
      if (!currentGroup) {
        // Start new group
        currentGroup = {
          id: leave.id,
          employeeId: leave.employeeId,
          employeeName: leave.employeeName,
          department: leave.department,
          startDate: leave.leave_date,
          endDate: leave.leave_date,
          duration: 1,
          reason: leave.reason,
          leaveIds: [leave.id]
        };
      } else if (
        currentGroup.employeeId === leave.employeeId &&
        this.isConsecutiveDay(currentGroup.endDate, leave.leave_date)
      ) {
        // Extend current group
        currentGroup.endDate = leave.leave_date;
        currentGroup.duration++;
        currentGroup.leaveIds.push(leave.id);
      } else {
        // Save current group and start new one
        grouped.push({ ...currentGroup });
        currentGroup = {
          id: leave.id,
          employeeId: leave.employeeId,
          employeeName: leave.employeeName,
          department: leave.department,
          startDate: leave.leave_date,
          endDate: leave.leave_date,
          duration: 1,
          reason: leave.reason,
          leaveIds: [leave.id]
        };
      }
    });

    // Don't forget the last group
    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped;
  }

  // Helper to check if dates are consecutive
  private isConsecutiveDay(date1Str: string, date2Str: string): boolean {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    
    // Add 1 day to date1
    const nextDay = new Date(d1);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return nextDay.toDateString() === d2.toDateString();
  }

  approveLeave(leaveIds: number[]) {
    if (!confirm(`Approve leave request for ${leaveIds.length} day(s)?`)) return;

    // Approve all leave IDs in the group
    const approvalPromises = leaveIds.map(id => 
      this.attendanceService.approveLeave(id).toPromise()
    );

    Promise.all(approvalPromises).then(() => {
      this.loadLeaveRequests();
      alert('Leave request approved successfully');
    }).catch(err => {
      console.error('Approval error:', err);
      alert('Error approving leave request');
    });
  }

  rejectLeave(leaveIds: number[]) {
    if (!confirm(`Reject leave request for ${leaveIds.length} day(s)?`)) return;

    const rejectionPromises = leaveIds.map(id => 
      this.attendanceService.rejectLeave(id).toPromise()
    );

    Promise.all(rejectionPromises).then(() => {
      this.loadLeaveRequests();
      alert('Leave request rejected');
    }).catch(err => {
      console.error('Rejection error:', err);
      alert('Error rejecting leave request');
    });
  }

  // Helper method to format date range
  getDateRangeText(startDate: string, endDate: string, duration: number): string {
    if (startDate === endDate) {
      return new Date(startDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    const start = new Date(startDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const end = new Date(endDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return `${start} - ${end}`;
  }

  // Date Management
  onDateChange(e: any) {
    this.selectedDate = e.target.value;
    this.loadDailyData();
  }

  selectToday() {
    this.selectedDate = this.formatDate(new Date());
    this.loadDailyData();
  }

  onMonthChange() {
    this.loadMonthlyData();
  }

  // Data Loading
  private loadEmployees() {
    this.employeeService.getEmployees().subscribe(res => {
      this.allEmployees = res;
      this.cdr.detectChanges();
    });
  }

  toggleSettings(event: MouseEvent) {
    event.stopPropagation();
    this.showSettings = !this.showSettings;
  }

  closeSettings() {
    this.showSettings = false;
  }

  private loadDailyData() {
    this.attendanceService.getAttendanceByDate(this.selectedDate)
      .subscribe(data => {
        // Create a map of employee IDs to attendance records for quick lookup
        const attendanceMap = new Map();
        data.forEach(record => {
          attendanceMap.set(record.employeeId, record);
        });

        // Create attendance records for ALL employees
        this.attendanceRecords = this.allEmployees.map(employee => {
          // Check if employee has an attendance record
          if (attendanceMap.has(employee.id)) {
            return attendanceMap.get(employee.id);
          }
          
          // Employee hasn't marked attendance - create a 'not-marked' record
          return {
            employeeId: employee.id,
            employeeName: employee.name,
            employeeDepartment: employee.department,
            status: 'not-marked',
            checkInTime: null,
            checkOutTime: null,
            workHours: 0,
            project: null,
            workDetails: null
          };
        });

        this.filteredRecords = [...this.attendanceRecords];
        this.calculateOverview();
        this.calculateQuickStats();
      });
  }

  private loadMonthlyData() {
    this.attendanceService.getMonthlyAnalytics(this.selectedMonth)
      .subscribe(data => {
        this.attendanceSummary = data.map(summary => {
          // Parse selectedMonth: "2026-02"
          const [year, monthNum] = this.selectedMonth.split('-').map(Number);
          const month = monthNum - 1; // Convert to 0-based month for Date()

          // Generate all days in the month
          const allDays = this.generateFullMonthDays(year, month);

          // Get backend data (if it exists)
          const backendData: DailyAttendanceRecord[] = summary.monthlyData || [];
          
          // Create a map for quick lookup: date string -> attendance record
          const dataMap = new Map<string, DailyAttendanceRecord>();
          backendData.forEach((record: DailyAttendanceRecord) => {
            const dateStr = new Date(record.date).toISOString().split('T')[0];
            dataMap.set(dateStr, record);
          });

          // Build monthlyData with full calendar, using backend data where available
          summary.monthlyData = allDays.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            
            // Check if backend has data for this date
            if (dataMap.has(dateStr)) {
              return dataMap.get(dateStr);
            }

            // No backend data - determine appropriate status
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);

            let status: string;
            if (checkDate > today) {
              status = 'future';
            } else if (this.isWeekend(checkDate)) {
              status = 'not-marked'; // Weekend - no attendance expected
            } else {
              status = 'not-marked'; // Past working day with no record
            }

            return {
              date: date.toISOString(),
              status,
              workHours: 0,
              overtime: 0,
              checkInTime: null
            } as DailyAttendanceRecord;
          });

          return summary;
        });

        this.cdr.detectChanges();
      });
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  }

  // Calculations
  private calculateOverview() {
    const stats = { 
      present: 0, 
      absent: 0, 
      halfDay: 0,
      leave: 0, 
      notMarked: 0,
      total: this.allEmployees.length  // Total employees in the system
    };

    this.attendanceRecords.forEach(r => {
      if (r.status === 'present') stats.present++;
      else if (r.status === 'absent') stats.absent++;
      else if (r.status === 'half-day') stats.halfDay++;
      else if (r.status === 'leave') stats.leave++;
      else if (r.status === 'not-marked') stats.notMarked++;
    });

    // Calculate employees who haven't marked attendance yet
    const markedCount = this.attendanceRecords.length;
    stats.notMarked = stats.total - markedCount;

    this.todayOverview = stats;
    this.cdr.detectChanges();
  }

  private calculateQuickStats() {
    this.quickStats = {
      onTime: this.attendanceRecords.filter(r => this.isOnTime(r)).length,
      lateComers: this.attendanceRecords.filter(r => this.isLate(r)).length,
      earlyLeavers: this.attendanceRecords.filter(r => this.isEarlyLeaver(r)).length
    };

    this.cdr.detectChanges();
  }

  // Search & Filter
  onSearch() {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredRecords = this.attendanceRecords.filter(r =>
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeDepartment?.toLowerCase().includes(q)
    );
  }

  filterByStatus(status: string) {
    this.statusFilter = status;

    if (status === 'all') {
      this.filteredRecords = [...this.attendanceRecords];
    } else {
      this.filteredRecords = this.attendanceRecords.filter(
        r => r.status === status
      );
    }
  }

  onSortChange() {
    const records = [...this.filteredRecords];

    switch (this.sortBy) {
      case 'name':
        records.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        break;

      case 'department':
        records.sort((a, b) => a.employeeDepartment.localeCompare(b.employeeDepartment));
        break;

      case 'status':
        records.sort((a, b) => a.status.localeCompare(b.status));
        break;

      case 'checkIn':
        records.sort((a, b) => 
          (a.checkInTime || '').localeCompare(b.checkInTime || '')
        );
        break;
    }

    this.filteredRecords = records;
  }

  private isOnTime(record: any): boolean {
    if (!record.checkInTime) return false; 

    const inTime = new Date(`1970-01-01T${record.checkInTime}`);
    const limit = new Date(`1970-01-01T09:30:00`);

    return inTime <= limit;
  }

  private isLate(record: any): boolean {
    if (!record.checkInTime) return false; 

    const inTime = new Date(`1970-01-01T${record.checkInTime}`);
    const limit = new Date(`1970-01-01T09:30:00`);

    return inTime > limit;
  }

 private isEarlyLeaver(record: any): boolean {
  // Only consider someone an early leaver if they have checked out before 6 PM
  if (!record.checkOutTime) return false; // No checkout time = not an early leaver

  const checkoutTime = new Date(`1970-01-01T${record.checkOutTime}`);
  const officeEndTime = new Date(`1970-01-01T18:00:00`); // 6:00 PM in 24-hour format

  return checkoutTime < officeEndTime;
}

  // Settings
  toggleAutoMark() {
    console.log('Auto-mark toggled:', this.autoMarkEnabled);
    this.cdr.detectChanges();
  }

  toggleNotifications() {
    console.log('Notifications toggled:', this.notificationsEnabled);
    this.cdr.detectChanges();
  }

  // Actions
  sendReminder() {
    console.log('Sending reminder to employees with pending attendance');
    alert('Reminder sent to all employees who have not marked attendance');
  }

  exportToPDF() {
    console.log('Exporting to PDF');
    alert('PDF export feature coming soon');
  }

  // Monthly View - Employee Details Toggle
  toggleEmployeeDetails(employeeId: string) {
    this.expandedEmployeeId = this.expandedEmployeeId === employeeId ? null : employeeId;
    this.cdr.detectChanges();
  }

  // Helper Methods for Styling
  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'present': '✅',
      'absent': '❌',
      'half-day': '⏰',
      'leave': '🏖️',
      'not-marked': '⏳'
    };
    return icons[status] || '⏳';
  }

  getEmployeeColor(employeeId: any): string {
    if (!employeeId) return '#ccc';

    const idStr = String(employeeId);

    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
      '#9C27B0', '#00BCD4', '#CDDC39', '#FF5722'
    ];

    const hash = idStr
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return colors[hash % colors.length];
  }

  getTrendClass(trend: number): string {
    if (trend > 0) return 'trend-up';
    if (trend < 0) return 'trend-down';
    return 'trend-neutral';
  }

  getPercentageClass(percentage: number): string {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    return 'poor';
  }

  getOverallStatusClass(percentage: number): string {
    if (percentage >= 90) return 'status-excellent';
    if (percentage >= 75) return 'status-good';
    if (percentage >= 60) return 'status-average';
    return 'status-poor';
  }

  getOverallStatusText(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Average';
    return 'Needs Improvement';
  }

  formatTime(time: string): Date | null {
    if (!time) return null;

    const today = new Date().toISOString().split('T')[0]; 
    return new Date(`${today}T${time}`);
  }

  // Utility Methods
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatMonth(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private generateFullMonthDays(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // last day of month
    const days: Date[] = [];
    
    let currentDate = new Date(firstDay);
    while (currentDate <= lastDay) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  }

  private generateMonthsList() {
    const currentDate = new Date();
    this.months = [];
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      this.months.push(monthDate);
    }
    console.log('Generated months:', this.months.map(m => this.formatMonth(m)));
  }

  getEmployeeName(empId: any) {
    return this.allEmployees.find(e => +e.id === +empId)?.name || '—';
  }

  getEmployeeDept(empId: any) {
    return this.allEmployees.find(e => +e.id === +empId)?.department || '—';
  }
}