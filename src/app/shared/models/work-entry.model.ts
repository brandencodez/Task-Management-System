export interface WorkEntry {
<<<<<<< HEAD
  id: number;
  project: string;
  description: string;
  hours: number;
  progress: number;
  date: string;
}
=======
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD format
  project: string;
  description: string;
  hours: number;
  progress: number; // 0-100
  workDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}
>>>>>>> adf6076 (update User Attendance)
