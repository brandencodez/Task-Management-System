import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../shared/services/attendance.service';

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
  attendanceRecords: any[] = [];
  attendanceSummary: any[] = [];
  months: Date[] = [];
  allEmployees: any[] = [];
  
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
  
  officeEndTime = '6:30'; // Display format
  private officeEndTimeMinutes = 18 * 60 + 30; // 6:30 PM in minutes
  private timer: any;

  constructor(private attendanceService: AttendanceService) {
    const today = new Date();
    this.selectedDate = this.formatDate(today);
    this.selectedMonth = this.formatMonth(today);
  }

  ngOnInit() {
    this.generateMonths();
    this.loadEmployees();
    this.loadDailyData();
    this.loadMonthlyData();
    
    // Auto-check attendance status every minute
    this.timer = setInterval(() => {
      this.checkOfficeTimeAndUpdate();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // Check if it's past office time and update status
  checkOfficeTimeAndUpdate() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    if (currentTime >= this.officeEndTimeMinutes) {
      this.autoMarkAbsentForUnmarked();
    }
  }

  // Auto-mark absent for who haven't marked attendance
  autoMarkAbsentForUnmarked() {
    const todayStr = this.formatDate(new Date());
    this.allEmployees.forEach(employee => {
      const hasMarked = this.attendanceService.hasMarkedAttendanceToday(employee.id);
      if (!hasMarked) {
        // Check if already auto-marked today
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
            'Auto-marked (Not marked by ' + this.officeEndTime + ' PM)'
          );
          
          // Reload data
          this.loadDailyData();
        }
      }
    });
  }

  // View management
  onViewChange(view: 'daily' | 'monthly') {
    this.selectedView = view;
    if (view === 'daily') {
      this.loadDailyData();
 {
      this.loadMonthlyData();
    }
  }

  // Daily view methods
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

  // Monthly view methods
  onMonthChange() {
    this.loadMonthlyData();
  }

  toggleEmployeeDetails(employeeId: string) {
    this.expandedEmployeeId = this.expandedEmployeeId === employeeId ? null : employeeId;
  }

  // Data loading
  private loadDailyData() {
    const date = new Date(this.selectedDate);
    const todayStr = this.formatDate(date);
    const isToday = todayStr === this.formatDate(new Date());
    
    // Get marked attendance from service
    const markedRecords = this.attendanceService.getAttendanceByDate(date) || [];

    // Combine with all employees
    this.attendanceRecords = this.allEmployees.map(employee => {
      const existingRecord = markedRecords.find(record => record.employeeId === employee.id);
      
      if (existingRecord) {
        return {
          ...existingRecord,
          employeeName: employee.name,
          autoMarked: false,
          notMarked: false
        };
      } else {
        // Check if it's past office time for today
        if (isToday) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          if (currentTime >= this.officeEndTimeMinutes) {
            return {
              id: 'auto-' + employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date,
              status: 'absent',
              checkInTime: null,
              remarks: 'Auto-marked (Not marked by ' + this.officeEndTime + ' PM)',
              autoMarked: true,
              notMarked: false
            };
          } else {
            return {
              id: 'pending-' + employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date,
              status: 'not-marked',
              checkInTime: null,
              remarks: 'Not yet marked',
              autoMarked: false,
              notMarked: true
            };
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
              remarks: 'No attendance marked',
              autoMarked: true,
              notMarked: false
            };
          } else {
            // Future date
            return {
              id: 'future-' + employee.id,
              employeeId: employee.id,
              employeeName: employee.name,
              date: date,
              status: 'not-marked',
              checkInTime: null,
              remarks: 'Future date',
              autoMarked: false,
              notMarked: true
            }; 
          }
        }
      }
    });

    this.calculateTodayOverview();
  }

  private loadMonthlyData() {
    if (!this.selectedMonth) {
      this.attendanceSummary = [];
      return;
    }
    
    // Generate monthly summary for all employees
    this.attendanceSummary = this.allEmployees.map(employee => {
      const monthlyData = this.getEmployeeMonthlyData(employee.id) || [];
      
      // Filter out future days (we don't show them)
      const actualData = monthlyData.filter(d => d.status !== 'future');
      
      const presentDays = actualData.filter(d => d.status === 'present').length;
      const absentDays = actualData.filter(d => d.status === 'absent').length;
      const halfDays = actualData.filter(d => d.status === 'half-day').length;
      const leaveDays = actualData.filter(d => d.status === 'leave').length;
      const notMarkedDays = actualData.filter(d => d.status === 'not-marked').length;
      const workingDays = actualData.length;
      
      // Calculate percentage
      let attendancePercentage = 0;
      if (workingDays > 0) {
        attendancePercentage = Math.round((presentDays / workingDays) * 100);
      }
      
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalPresent: presentDays,
        totalAbsent: absentDays,
        totalHalfDays: halfDays,
        totalLeaves: leaveDays,
        notMarkedDays: notMarkedDays,
        workingDays: workingDays,
        attendancePercentage: attendancePercentage,
        monthlyData: actualData // Only actual days (no future)
      };
    });
  }

  private loadEmployees() {
    // Load only employees that are in the system
    // These should match what's in your actual system
    this.allEmployees = [
      { id: '1', name: 'Rahul Kumar', department: 'Development' },
      { id: '2', name: 'Priya Sharma', department: 'HR' },
      { id: '3', name: 'Amit Patel', department: 'Design' },
      { id: '4', name: 'Sneha Reddy', department: 'QA' }
    ];
  }

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
        case 'present': counts.present++; break;
        case 'absent': counts.absent++; break;
        case 'half-day': counts.halfDay++; break;
        case 'leave': counts.leave++; break;
        case 'not-marked': counts.notMarked++; break;
      }
    });

    this.todayOverview = counts;
  }

  // Helper methods
  getEmployeeDepartment(employeeId: string): string {
    const employee = this.allEmployees.find(e => e.id === employeeId);
    return employee ? employee.department : 'Unknown';
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'half-day': return 'status-halfday';
      case 'leave': return 'status-leave';
      case 'not-marked': return 'status-notmarked';
      default: return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'half-day': return '⏰';
      case 'leave': return '🏖️';
      case 'not-marked': return '⏳';
      default: return '❓';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'present': return 'PRESENT';
      case 'absent': return 'ABSENT';
      case 'half-day': return 'HALF DAY';
      case 'leave': return 'ON LEAVE';
      case 'not-marked': return 'NOT MARKED';
      default: return 'UNKNOWN';
    }
  }

  getOverallStatusClass(percentage: number): string {
    if (percentage >= 90) return 'status-excellent';
    if (percentage >= 75) return 'status-good';
    return 'status-poor';
  }

  getOverallStatusText(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Poor';
  }

  getPercentageClass(percentage: number): string {
    if (percentage >= 90) return 'high';
    if (percentage >= 75) return 'medium';
    return 'low';
  }

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
            status: 'future'
          });
          continue;
        }
        
        // Check if employee has marked attendance for this day
        const record = employeeRecords.find(r => {
          if (!r || !r.date) return false;
          const recordDate = new Date(r.date);
          return this.formatDate(recordDate) === dateStr;
        });
        
        if (record) {
          data.push({
            date: date,
            status: record.status || 'absent'
          });
        } else {
          // No record found
          if (dateStr === this.formatDate(today)) {
            // Today - check if past office time
            const currentTime = today.getHours() * 60 + today.getMinutes();
            if (currentTime >= this.officeEndTimeMinutes) {
              data.push({
                date: date,
                status: 'absent'
              });
            } else {
              data.push({
                date: date,
                status: 'not-marked'
              });
            }
          } else {
            // Past date with no record = absent
            data.push({
              date: date,
              status: 'absent'
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

  // Utility methods
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

  private generateMonths() {
    const months: Date[] = [];
    const startDate = new Date(2026, 0, 1); // January 2026
    const today = new Date();
    
    // Generate months from Jan 2026 to current month
    let current = new Date(startDate);
    while (current <= today) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    this.months = months;
  }
}