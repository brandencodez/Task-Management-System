import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReminderService } from '../reminder.service';
import { Reminder } from '../../../shared/models/reminder.model';
import { ReminderFormComponent } from '../reminder-form/reminder-form.component';

@Component({
  selector: 'app-reminder-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ReminderFormComponent],
  templateUrl: './reminder-list.component.html',
  styleUrls: ['./reminder-list.component.css']
})
export class ReminderListComponent implements OnInit {
  reminders: Reminder[] = [];
  searchText = '';

  constructor(
    private reminderService: ReminderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.reminderService.getReminders().subscribe(reminders => {
      this.reminders = reminders;
      this.cdr.detectChanges();
    });
  }

  delete(id: number): void {
    if (confirm('Delete this reminder?')) {
      this.reminderService.deleteReminder(id).subscribe({
        next: () => {
          alert('Reminder deleted!');
          this.loadReminders();
        },
        error: () => {
          alert('Failed to delete reminder.');
        }
      });
    }
  }

  getReminderStatus(reminder: Reminder): 'Today' | 'Upcoming' | 'Missed' {
    const today = this.getTodayDate();
    if (reminder.meeting_date === today) return 'Today';
    if (reminder.meeting_date > today) return 'Upcoming';
    return 'Missed';
  }

  get filteredReminders(): Reminder[] {
    if (!this.searchText.trim()) return this.reminders;
    const s = this.searchText.toLowerCase();
    return this.reminders.filter(r =>
      r.title?.toLowerCase().includes(s) ||
      r.employee_name?.toLowerCase().includes(s) ||
      r.client_name?.toLowerCase().includes(s) ||
      r.department?.toLowerCase().includes(s) ||
      this.getReminderStatus(r).toLowerCase().includes(s)
    );
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}