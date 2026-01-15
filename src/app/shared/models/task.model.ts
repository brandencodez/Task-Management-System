export interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  startDate: string;
  endDate: string;
  status: 'ON_TRACK' | 'WARNING' | 'OVERDUE';
}
