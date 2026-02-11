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

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-attendance.component.html',
  styleUrls: ['./admin-attendance.component.css']
})
export class AdminAttendanceComponent implements OnInit {

  selectedView: 'daily' | 'monthly' = 'daily';
  selectedDate = this.formatDate(new Date());
  selectedMonth = this.formatMonth(new Date());

  attendanceRecords: any[] = [];
  filteredRecords: any[] = []; 
  attendanceSummary: any[] = [];
  allEmployees: any[] = [];

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
  onViewChange(view: 'daily' | 'monthly') {
    this.selectedView = view;
    view === 'daily' ? this.loadDailyData() : this.loadMonthlyData();
    this.cdr.detectChanges();
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

  showSettings = false;

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
    return record.workHours < 8; 
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
