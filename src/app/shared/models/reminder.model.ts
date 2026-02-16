export interface Reminder {
  id: number;
  employee_id: number;          
  employee_name: string;        
  title: string;
  purpose: string;
  department: string;
  client_name: string;
  client_contact: string;
  meeting_link?: string;
  meeting_date: string;         
  meeting_datetime?: string;
  remind_on: string;
  status?: 'scheduled' | 'completed' | 'missed';
  notified?: number;
}

export interface MeetingNotification {
  id: number;
  title: string;
  meeting_datetime: string;
  employee_name?: string;
}