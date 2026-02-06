// admin-attendance.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../shared/services/attendance.service';
import { EmployeeService } from '../../employees/employee.service';
import { WorkEntryService } from '../../../shared/services/work-entry.service';
import { Subscription } from 'rxjs';

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  joinDate: Date;
  avatarColor?: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  status: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  remarks: string;
  autoMarked: boolean;
  notMarked: boolean;
  employeeDepartment?: string;
  checkInLocation?: string;
  workHours?: number;
  overtime?: number;
  lateArrival?: boolean;
  earlyDeparture?: boolean;
  workFromHome?: boolean;
  project?: string;
  location?: string;
  workDetails?: string;
}

interface MonthlySummary {
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  totalPresent: number;
  totalAbsent: number;
  totalHalfDays: number;
  totalLeaves: number;
  notMarkedDays: number;
  workingDays: number;
  attendancePercentage: number;
  averageWorkHours: string;
  totalOvertime: string;
  trend: number;
  monthlyData: any[];
  lateArrivals: number;
  earlyDepartures: number;
}

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-attendance.component.html',
  styleUrls: ['./admin-attendance.component.css']
})
export class AdminAttendanceComponent implements OnInit, OnDestroy {
  // View state
  selectedView: 'daily' | 'monthly' = 'daily';
  selectedDate: string;
  selectedMonth: string;
  
  // Data
  attendanceRecords: AttendanceRecord[] = [];
  attendanceSummary: MonthlySummary[] = [];
  months: Date[] = [];
  allEmployees: Employee[] = [];
  
  // UI state
  expandedEmployeeId: string | null = null;
  todayOverview = {
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    notMarked: 0,
    total: 0
  };

  // Search & Filter state
  searchQuery: string = '';
  statusFilter: string = 'all';
  departmentFilter: string = 'all';
  sortBy: string = 'name';
  
  // Settings
  officeEndTime = '6:30 PM';
  autoMarkEnabled = true;
  notificationsEnabled = true;
  
  // Quick stats
  quickStats = {
    onTime: 0,
    lateComers: 0,
    workFromHome: 0,
    earlyLeavers: 0
  };
  
  private timer: any;
  private officeEndTimeMinutes = 18 * 60 + 30; // 6:30 PM in minutes
  private subscriptions: Subscription[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private workEntryService: WorkEntryService
  ) {
    const today = new Date();
    this.selectedDate = this.formatDate(today);
    this.selectedMonth = this.formatMonth(today);
  }

  ngOnInit() {
    this.generateMonths();
    this.loadEmployees();
    this.loadDailyData();
    this.loadMonthlyData();
    
    // Subscribe to work entries and attendance updates
    this.subscriptions.push(
      this.workEntryService.workEntries$.subscribe(() => {
        if (this.selectedView === 'daily') {
          this.loadDailyData();
        } else {
          this.loadMonthlyData();
        }
      })
    );
    
    // Auto-check attendance status every minute
    this.timer = setInterval(() => {
      this.checkOfficeTimeAndUpdate();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // View Management
  onViewChange(view: 'daily' | 'monthly') {
    this.selectedView = view;
    if (view === 'daily') {
      this.loadDailyData();
    } else {
      this.loadMonthlyData();
    }
  }

  // Daily View Methods
  onDateChange(event?: any) {
    if (event && event.target) {
      this.selectedDate = event.target.value;
      this.loadDailyData();
    }
  }

  selectToday() {
    const today = new Date();
    this.selectedDate = this.formatDate(today);
    this.loadDailyData();
  }

  quickDateSelect(daysOffset: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    this.selectedDate = this.formatDate(date);
    this.loadDailyData();
  }

  // Monthly View Methods
  onMonthChange() {
    this.loadMonthlyData();
  }

  toggleEmployeeDetails(employeeId: string) {
    if (this.expandedEmployeeId === employeeId) {
      this.expandedEmployeeId = null;
    } else {
      this.expandedEmployeeId = employeeId;
    }
  }

  // Filter Methods
  filterByStatus(status: string) {
    this.statusFilter = status;
    this.applyFilters();
  }

  filterByDepartment(department: string) {
    this.departmentFilter = department;
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  onSortChange() {
    this.sortRecords();
  }

  // Data Loading
  private loadDailyData() {
    const date = new Date(this.selectedDate);
    const todayStr = this.formatDate(date);
    const isToday = todayStr === this.formatDate(new Date());
    
    // Get marked attendance from service
    const markedRecords: any[] = this.attendanceService.getAttendanceByDate(date) || [];
    
    // Reset quick stats
    this.quickStats = {
      onTime: 0,
      lateComers: 0,
      workFromHome: 0,
      earlyLeavers: 0
    };
    
    // Enhanced employee combination with work entry details
    this.attendanceRecords = this.allEmployees.map(employee => {
      // Check for existing attendance record
      const existingRecord = markedRecords.find((record: any) => record.employeeId === employee.id);
      
      // Check for work entries for this employee on this date
      const workEntries = this.workEntryService.getByEmployeeAndDate(employee.id, todayStr);
      const hasWorkEntries = workEntries.length > 0;
      
      if (existingRecord) {
        // Use existing attendance record
        const checkInTime = existingRecord.checkInTime ? new Date(existingRecord.checkInTime) : null;
        const checkOutTime = existingRecord.checkOutTime ? new Date(existingRecord.checkOutTime) : null;
        const isLate = this.isLateArrival(checkInTime);
        const isEarly = this.isEarlyDeparture(checkOutTime);
        const workHours = existingRecord.workHours || this.calculateWorkHours(checkInTime, checkOutTime);
        const overtime = this.calculateOvertime(checkInTime, checkOutTime);
        
        // Update quick stats
        if (isLate) this.quickStats.lateComers++;
        if (isEarly) this.quickStats.earlyLeavers++;
        if (!isLate) this.quickStats.onTime++;
        
        return {
          id: existingRecord.id || 'record-' + employee.id,
          employeeId: employee.id,
          employeeName: employee.name,
          date: date,
          status: existingRecord.status || 'present',
          checkInTime: checkInTime,
          checkOutTime: checkOutTime,
          remarks: existingRecord.remarks || '',
          autoMarked: false,
          notMarked: false,
          employeeDepartment: employee.department,
          checkInLocation: existingRecord.checkInLocation || 'Office',
          workHours: workHours,
          overtime: overtime || 0,
          lateArrival: isLate,
          earlyDeparture: isEarly,
          workFromHome: existingRecord.workFromHome || false,
          project: existingRecord.project || (workEntries[0]?.project || 'General'),
          workDetails: existingRecord.workDetails || this.getWorkDetailsFromEntries(workEntries)
        } as AttendanceRecord;
      } else if (hasWorkEntries) {
        // Mark as present based on work entries
        const totalHours = workEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const firstEntry = workEntries[0];
        const lastEntry = workEntries[workEntries.length - 1];
        
        this.quickStats.onTime++;
        
        // Create/Update attendance from work entries
        this.attendanceService.updateAttendanceWithWorkEntry(
          employee.id,
          todayStr,
          {
            workDetails: this.getWorkDetailsFromEntries(workEntries),
            project: firstEntry.project,
            hours: totalHours
          }
        );
        
        return {
          id: 'work-' + employee.id,
          employeeId: employee.id,
          employeeName: employee.name,
          date: date,
          status: 'present',
          checkInTime: null,
          checkOutTime: null,
          remarks: 'Marked from work entries',
          autoMarked: false,
          notMarked: false,
          employeeDepartment: employee.department,
          checkInLocation: 'Work Entry',
          workHours: totalHours,
          overtime: totalHours > 8 ? totalHours - 8 : 0,
          lateArrival: false,
          earlyDeparture: false,
          workFromHome: false,
          project: firstEntry.project,
          workDetails: this.getWorkDetailsFromEntries(workEntries)
        } as AttendanceRecord;
      } else {
        // No attendance or work entries
        if (isToday) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          if (this.autoMarkEnabled && currentTime >= this.officeEndTimeMinutes) {
            return {
              id: 'auto-' + employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date,
              status: 'absent',
              checkInTime: null,
              checkOutTime: null,
              remarks: 'Auto-marked (Not marked by ' + this.officeEndTime + ')',
              autoMarked: true,
              notMarked: false,
              employeeDepartment: employee.department,
              checkInLocation: 'System',
              workHours: 0,
              overtime: 0,
              lateArrival: false,
              earlyDeparture: false,
              workFromHome: false,
              project: 'General'
            } as AttendanceRecord;
          } else {
            return {
              id: 'pending-' + employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date,
              status: 'not-marked',
              checkInTime: null,
              checkOutTime: null,
              remarks: 'Not yet marked',
              autoMarked: false,
              notMarked: true,
              employeeDepartment: employee.department,
              checkInLocation: 'Not available',
              workHours: 0,
              overtime: 0,
              lateArrival: false,
              earlyDeparture: false,
              workFromHome: false,
              project: 'General'
            } as AttendanceRecord;
          }
        } else {
          // For past dates
          const recordDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          recordDate.setHours(0, 0, 0, 0);
          
          if (recordDate < today) {
            // Past date, no record = absent
            return {
              id: 'absent-' + employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date,
              status: 'absent',
              checkInTime: null,
              checkOutTime: null,
              remarks: 'No attendance marked',
              autoMarked: true,
              notMarked: false,
              employeeDepartment: employee.department,
              checkInLocation: 'Not available',
              workHours: 0,
              overtime: 0,
              lateArrival: false,
              earlyDeparture: false,
              workFromHome: false,
              project: 'General'
            } as AttendanceRecord;
          } else {
            // Future date
            return {
              id: 'future-' + employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date,
              status: 'future',
              checkInTime: null,
              checkOutTime: null,
              remarks: 'Future date',
              autoMarked: false,
              notMarked: true,
              employeeDepartment: employee.department,
              checkInLocation: 'Not available',
              workHours: 0,
              overtime: 0,
              lateArrival: false,
              earlyDeparture: false,
              workFromHome: false,
              project: 'General'
            } as AttendanceRecord;
          }
        }
      }
    });
    
    this.calculateTodayOverview();
    this.sortRecords();
  }

  private loadMonthlyData() {
    if (!this.selectedMonth) {
      this.attendanceSummary = [];
      return;
    }
    
    // Generate enhanced monthly summary with detailed analytics
    this.attendanceSummary = this.allEmployees.map(employee => {
      const monthlyData = this.getEmployeeMonthlyData(employee.id);
      
      // Calculate detailed statistics
      const presentDays = monthlyData.filter((d: any) => d.status === 'present').length;
      const absentDays = monthlyData.filter((d: any) => d.status === 'absent').length;
      const halfDays = monthlyData.filter((d: any) => d.status === 'half-day').length;
      const leaveDays = monthlyData.filter((d: any) => d.status === 'leave').length;
      const notMarkedDays = monthlyData.filter((d: any) => d.status === 'not-marked').length;
      const workingDays = monthlyData.filter((d: any) => d.status !== 'future').length;
      
      // Calculate average work hours for present days
      const presentRecords = monthlyData.filter((d: any) => d.status === 'present');
      const totalWorkHours = presentRecords.reduce((sum: number, record: any) => sum + (record.workHours || 0), 0);
      const averageWorkHours = presentDays > 0 ? (totalWorkHours / presentDays) : 0;
      
      // Calculate overtime
      const totalOvertime = presentRecords.reduce((sum: number, record: any) => sum + (record.overtime || 0), 0);
      
      // Calculate attendance percentage
      let attendancePercentage = 0;
      if (workingDays > 0) {
        attendancePercentage = Math.round((presentDays / workingDays) * 100);
      }
      
      // Determine trends
      const trend = this.calculateAttendanceTrend(employee.id);
      
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeDepartment: employee.department,
        totalPresent: presentDays,
        totalAbsent: absentDays,
        totalHalfDays: halfDays,
        totalLeaves: leaveDays,
        notMarkedDays: notMarkedDays,
        workingDays: workingDays,
        attendancePercentage: attendancePercentage,
        averageWorkHours: averageWorkHours.toFixed(1),
        totalOvertime: totalOvertime.toFixed(1),
        trend: trend,
        monthlyData: monthlyData,
        lateArrivals: presentRecords.filter((r: any) => r.lateArrival).length,
        earlyDepartures: presentRecords.filter((r: any) => r.earlyDeparture).length
      } as MonthlySummary;
    });
    
    // Sort by attendance percentage (descending)
    this.attendanceSummary.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
  }

  private loadEmployees() {
    // Load real employees from the EmployeeService
    this.allEmployees = this.employeeService.getEmployees().map(emp => ({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      position: emp.position,
      joinDate: new Date(emp.joinDate),
      avatarColor: this.generateAvatarColor(emp.id)
    }));
  }

  // Filtering & Sorting
  private applyFilters() {
    // Start with all records
    this.loadDailyData();
    
    let filtered = [...this.attendanceRecords];
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === this.statusFilter);
    }
    
    // Apply department filter
    if (this.departmentFilter !== 'all') {
      filtered = filtered.filter(record => record.employeeDepartment === this.departmentFilter);
    }
    
    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.employeeName.toLowerCase().includes(query) ||
        (record.employeeDepartment?.toLowerCase() || '').includes(query) ||
        record.remarks.toLowerCase().includes(query)
      );
    }
    
    this.attendanceRecords = filtered;
    this.sortRecords();
  }

  private sortRecords() {
    const records = [...this.attendanceRecords];
    
    switch(this.sortBy) {
      case 'name':
        records.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        break;
      case 'status':
        const statusOrder: { [key: string]: number } = { 
          'present': 1, 
          'half-day': 2, 
          'leave': 3, 
          'not-marked': 4, 
          'absent': 5, 
          'future': 6 
        };
        records.sort((a, b) => 
          (statusOrder[a.status] || 7) - (statusOrder[b.status] || 7)
        );
        break;
      case 'department':
        records.sort((a, b) => 
          (a.employeeDepartment || '').localeCompare(b.employeeDepartment || '')
        );
        break;
      case 'checkIn':
        records.sort((a, b) => {
          if (!a.checkInTime && !b.checkInTime) return 0;
          if (!a.checkInTime) return 1;
          if (!b.checkInTime) return -1;
          return a.checkInTime.getTime() - b.checkInTime.getTime();
        });
        break;
    }
    
    this.attendanceRecords = records;
  }

  // Helper Methods
  getEmployeeDepartment(employeeId: string): string {
    const employee = this.allEmployees.find(e => e.id === employeeId);
    return employee ? employee.department : 'Unknown';
  }

  getEmployeePosition(employeeId: string): string {
    const employee = this.allEmployees.find(e => e.id === employeeId);
    return employee ? employee.position : 'Not specified';
  }

  getEmployeeColor(employeeId: string): string {
    const employee = this.allEmployees.find(e => e.id === employeeId);
    return employee?.avatarColor || '#4f46e5';
  }

  getStatusClass(status: string): string {
    const classes: {[key: string]: string} = {
      'present': 'status-present',
      'absent': 'status-absent',
      'half-day': 'status-halfday',
      'leave': 'status-leave',
      'not-marked': 'status-notmarked',
      'future': 'status-future'
    };
    return classes[status] || 'status-unknown';
  }

  getStatusIcon(status: string): string {
    const icons: {[key: string]: string} = {
      'present': '✅',
      'absent': '❌',
      'half-day': '⏰',
      'leave': '🏖️',
      'not-marked': '⏳',
      'future': '📅'
    };
    return icons[status] || '❓';
  }

  getStatusText(status: string): string {
    const texts: {[key: string]: string} = {
      'present': 'PRESENT',
      'absent': 'ABSENT',
      'half-day': 'HALF DAY',
      'leave': 'ON LEAVE',
      'not-marked': 'NOT MARKED',
      'future': 'FUTURE DATE'
    };
    return texts[status] || 'UNKNOWN';
  }

  getOverallStatusClass(percentage: number): string {
    if (percentage >= 90) return 'status-excellent';
    if (percentage >= 75) return 'status-good';
    if (percentage >= 60) return 'status-fair';
    return 'status-poor';
  }

  getOverallStatusText(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Needs Attention';
  }

  getPercentageClass(percentage: number): string {
    if (percentage >= 90) return 'high';
    if (percentage >= 75) return 'medium';
    if (percentage >= 60) return 'low';
    return 'very-low';
  }

  getTrendClass(trend: number): string {
    if (trend >= 80) return 'trend-positive';
    if (trend >= 60) return 'trend-neutral';
    return 'trend-negative';
  }

  // Enhanced Data Processing
  private calculateTodayOverview() {
    const counts = {
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      notMarked: 0,
      total: this.attendanceRecords.length
    };

    this.attendanceRecords.forEach(record => {
      switch(record.status) {
        case 'present': 
          counts.present++; 
          break;
        case 'absent': counts.absent++; break;
        case 'half-day': counts.halfDay++; break;
        case 'leave': counts.leave++; break;
        case 'not-marked': counts.notMarked++; break;
      }
    });

    this.todayOverview = counts;
  }

  private isLateArrival(checkInTime: Date | null): boolean {
    if (!checkInTime) return false;
    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    // Consider late if check-in after 9:45 AM
    return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 45);
  }

  private isEarlyDeparture(checkOutTime: Date | null): boolean {
    if (!checkOutTime) return false;
    const checkOutHour = checkOutTime.getHours();
    const checkOutMinute = checkOutTime.getMinutes();
    // Consider early if check-out before 6:00 PM
    return checkOutHour < 18;
  }

  private calculateWorkHours(checkInTime: Date | null, checkOutTime: Date | null): number {
    if (!checkInTime || !checkOutTime) return 0;
    
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return parseFloat(diffHours.toFixed(2));
  }

  private calculateOvertime(checkInTime: Date | null, checkOutTime: Date | null): number {
    const workHours = this.calculateWorkHours(checkInTime, checkOutTime);
    const regularHours = 8; // Standard work hours
    
    if (workHours > regularHours) {
      return parseFloat((workHours - regularHours).toFixed(2));
    }
    return 0;
  }

  private calculateAttendanceTrend(employeeId: string): number {
    // Calculate trend based on last 7 days
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    let presentDays = 0;
    let totalDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(lastWeek);
      date.setDate(lastWeek.getDate() + i);
      
      // Simplified trend calculation
      const records = this.attendanceService.getAttendanceByDate(date) || [];
      const record = records.find((r: any) => r.employeeId === employeeId);
      if (record) {
        totalDays++;
        if (record.status === 'present') {
          presentDays++;
        }
      }
    }
    
    if (totalDays === 0) return 0;
    return Math.round((presentDays / totalDays) * 100);
  }

  // Actions
  markAllPresent() {
    if (confirm('Mark all unmarked employees as present?')) {
      this.attendanceRecords.forEach(record => {
        if (record.status === 'not-marked' || record.status === 'future') {
          record.status = 'present';
          record.remarks = 'Marked present by admin';
          record.autoMarked = false;
          record.notMarked = false;
          record.checkInTime = new Date();
          record.checkOutTime = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours later
          record.workHours = 8;
          record.overtime = 0;
        }
      });
      this.calculateTodayOverview();
    }
  }

  markAsPresent(record: AttendanceRecord) {
    record.status = 'present';
    record.remarks = 'Marked present by admin';
    record.autoMarked = false;
    record.notMarked = false;
    record.checkInTime = new Date();
    record.checkOutTime = new Date(Date.now() + 8 * 60 * 60 * 1000);
    record.workHours = 8;
    record.overtime = 0;
    this.calculateTodayOverview();
  }

  markAsAbsent(record: AttendanceRecord) {
    record.status = 'absent';
    record.remarks = 'Marked absent by admin';
    record.autoMarked = false;
    record.notMarked = false;
    this.calculateTodayOverview();
  }

  // Export Functions
  exportToPDF() {
    const data = this.selectedView === 'daily' ? this.attendanceRecords : this.attendanceSummary;
    const title = this.selectedView === 'daily' ? 'Daily Attendance Report' : 'Monthly Attendance Summary';
    
    // Create a simple text report
    let report = `${title}\n`;
    report += `Generated on: ${new Date().toLocaleDateString()}\n`;
    report += `Date: ${this.selectedDate}\n\n`;
    
    if (this.selectedView === 'daily') {
      report += 'Employee Attendance:\n';
      report += '================================\n';
      this.attendanceRecords.forEach(record => {
        report += `${record.employeeName} (${record.employeeDepartment}): ${record.status}\n`;
        if (record.checkInTime) {
          report += `  Check-in: ${record.checkInTime.toLocaleTimeString()}\n`;
        }
        if (record.remarks) {
          report += `  Remarks: ${record.remarks}\n`;
        }
        report += '\n';
      });
    } else {
      report += 'Monthly Attendance Summary:\n';
      report += '================================\n';
      this.attendanceSummary.forEach(summary => {
        report += `${summary.employeeName} (${summary.employeeDepartment}):\n`;
        report += `  Attendance: ${summary.attendancePercentage}%\n`;
        report += `  Present: ${summary.totalPresent}/${summary.workingDays} days\n`;
        report += `  Absent: ${summary.totalAbsent} days\n`;
        report += `  Leaves: ${summary.totalLeaves} days\n`;
        report += `  Half Days: ${summary.totalHalfDays} days\n\n`;
      });
    }
    
    // Create download link
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('Report exported successfully!');
  }

  exportToExcel() {
    console.log('Exporting to Excel...');
    alert('Excel export feature coming soon!');
  }

  // Settings Management
  toggleAutoMark() {
    this.autoMarkEnabled = !this.autoMarkEnabled;
    if (!this.autoMarkEnabled) {
      alert('Auto-mark feature disabled. Employees will not be auto-marked absent.');
    }
  }

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
  }

  // Notification Methods
  sendReminder() {
    if (confirm('Send attendance reminder to all employees?')) {
      console.log('Sending reminders...');
      alert('Reminders sent successfully!');
    }
  }

  // Utility Methods
  getEmployeeMonthlyData(employeeId: string): any[] {
    if (!this.selectedMonth) return [];
    
    try {
      const [year, month] = this.selectedMonth.split('-').map(Number);
      if (!year || !month) return [];
      
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const data = [];
      
      // Get attendance records for this employee
      const employeeRecords = this.attendanceService.getMyAttendance(employeeId) || [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = this.formatDate(date);
        
        // Only include days up to today
        if (date > today) {
          data.push({
            date: date,
            status: 'future',
            workHours: 0,
            overtime: 0
          });
          continue;
        }
        
        // Check if employee has marked attendance for this day
        const record = employeeRecords.find((r: any) => {
          if (!r || !r.date) return false;
          const recordDate = new Date(r.date);
          return this.formatDate(recordDate) === dateStr;
        });
        
        if (record) {
          data.push({
            date: date,
            status: record.status || 'absent',
            workHours: 8,
            overtime: 0,
            lateArrival: false,
            earlyDeparture: false
          });
        } else {
          // No record found
          if (dateStr === this.formatDate(today)) {
            // Today - check if past office time
            const currentTime = today.getHours() * 60 + today.getMinutes();
            if (this.autoMarkEnabled && currentTime >= this.officeEndTimeMinutes) {
              data.push({
                date: date,
                status: 'absent',
                workHours: 0,
                overtime: 0
              });
            } else {
              data.push({
                date: date,
                status: 'not-marked',
                workHours: 0,
                overtime: 0
              });
            }
          } else {
            // Past date with no record = absent
            data.push({
              date: date,
              status: 'absent',
              workHours: 0,
              overtime: 0
            });
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error generating monthly data:', error);
      return [];
    }
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
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
   * Get work details string from work entries
   */
  private getWorkDetailsFromEntries(workEntries: any[]): string {
    if (!workEntries || workEntries.length === 0) return '';
    return workEntries
      .map(entry => `${entry.project}: ${entry.description}`)
      .join('; ');
  }

  /**
   * Generate a consistent avatar color for an employee
   */
  private generateAvatarColor(employeeId: string): string {
    const colors = [
      '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
      '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'
    ];
    const index = Math.abs(employeeId.charCodeAt(0)) % colors.length;
    return colors[index];
  }

  private generateMonths() {
    const months: Date[] = [];
    const startDate = new Date(new Date().getFullYear() - 1, 0, 1); // 1 year back
    const today = new Date();
    
    let current = new Date(startDate);
    while (current <= today) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    this.months = months;
  }

  // Auto-mark functionality
  private checkOfficeTimeAndUpdate() {
    if (!this.autoMarkEnabled) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    if (currentTime >= this.officeEndTimeMinutes) {
      this.autoMarkAbsentForUnmarked();
    }
  }

  private autoMarkAbsentForUnmarked() {
    const todayStr = this.formatDate(new Date());
    
    this.allEmployees.forEach(employee => {
      const hasMarked = this.attendanceService.hasMarkedAttendanceToday(employee.id);
      if (!hasMarked) {
        const existingRecord = this.attendanceRecords.find(
          record => record.employeeId === employee.id && 
          record.date && 
          this.formatDate(new Date(record.date)) === todayStr &&
          record.autoMarked === true
        );
        
        if (!existingRecord) {
          // Auto-mark as absent
          this.attendanceService.markAttendance(
            employee.id,
            employee.name,
            'absent',
            `Auto-marked at ${this.officeEndTime} (System)`
          );
          
          // Update local records
          this.loadDailyData();
        }
      }
    });
  }

  // Get unique departments for filter
  getDepartments(): string[] {
    return [...new Set(this.allEmployees.map(emp => emp.department))];
  }
}