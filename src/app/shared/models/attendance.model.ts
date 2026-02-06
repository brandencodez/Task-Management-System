export interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  date: Date;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  checkInTime?: Date;
  checkOutTime?: Date;
  hoursWorked?: number;
  remarks?: string;
}

export interface AttendanceSummary {
  employeeId: number;
  employeeName: string;
  totalPresent: number;
  totalAbsent: number;
  totalHalfDays: number;
  totalLeaves: number;
  attendancePercentage: number;
  month: string;
}