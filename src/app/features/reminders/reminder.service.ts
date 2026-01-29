import { Injectable } from '@angular/core';

export interface Reminder {
  id: number;

  // 🔹 Employee
  employeeId: number;
  employeeName: string;

  // 🔹 Meeting info
  title: string;
  purpose: string;
  department: string;

  // 🔹 Client info
  clientName: string;
  clientContact: string;

  // 🔹 Meeting
  meetingLink?: string;
  meetingDate: string;
  remindOn: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReminderService {

  private STORAGE_KEY = 'reminders';

  getReminders(): Reminder[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  addReminder(reminder: Reminder): void {
    const reminders = this.getReminders();
    reminders.push(reminder);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
  }

  deleteReminder(id: number): void {
    const reminders = this.getReminders().filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
  }
}
