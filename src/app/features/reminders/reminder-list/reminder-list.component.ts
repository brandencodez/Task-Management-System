import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';   // ✅ REQUIRED
import { ReminderService, Reminder } from '../reminder.service';
import { ReminderFormComponent } from '../reminder-form/reminder-form.component';

@Component({
  selector: 'app-reminder-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,              // ✅ REQUIRED
    ReminderFormComponent
  ],
  templateUrl: './reminder-list.component.html',
  styleUrls: ['./reminder-list.component.css']
})
export class ReminderListComponent implements OnInit {

  reminders: Reminder[] = [];
  searchText = '';            // 🔍 SEARCH STATE

  constructor(private reminderService: ReminderService) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.reminders = this.reminderService.getReminders();
  }

  delete(id: number): void {
    this.reminderService.deleteReminder(id);
    this.loadReminders();
  }

  /* ================= STATUS ================= */
  getReminderStatus(reminder: Reminder): 'Today' | 'Upcoming' | 'Missed' {
    const today = this.getTodayDate();
    const meetingDate = reminder.meetingDate;

    if (!meetingDate) return 'Upcoming';
    if (meetingDate === today) return 'Today';
    if (meetingDate > today) return 'Upcoming';
    return 'Missed';
  }

  /* ================= SEARCH FILTER ================= */
  get filteredReminders(): Reminder[] {
    if (!this.searchText.trim()) {
      return this.reminders;
    }

    const s = this.searchText.toLowerCase();

    return this.reminders.filter(r =>
      r.title?.toLowerCase().includes(s) ||
      r.employeeName?.toLowerCase().includes(s) ||
      r.clientName?.toLowerCase().includes(s) ||
      r.department?.toLowerCase().includes(s) ||
      this.getReminderStatus(r).toLowerCase().includes(s)
    );
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
