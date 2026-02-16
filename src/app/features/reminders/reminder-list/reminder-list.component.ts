import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReminderService } from '../reminder.service';
import { Reminder } from '../../../shared/models/reminder.model';
import { ReminderFormComponent } from '../reminder-form/reminder-form.component';

@Component({
  selector: 'app-reminder-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReminderFormComponent],
  templateUrl: './reminder-list.component.html',
  styleUrls: ['./reminder-list.component.css']
})
export class ReminderListComponent implements OnInit {
  reminders: Reminder[] = [];
  editingReminder: Reminder | null = null;

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
      this.editingReminder = null;
      this.cdr.detectChanges();
    });
  }

  edit(r: Reminder): void {
    this.editingReminder = { ...r };
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  toggleComplete(r: Reminder): void {
    const action = r.status === 'completed'
      ? this.reminderService.reopenReminder(r.id)
      : this.reminderService.markCompleted(r.id);

    action.subscribe({
      next: () => this.loadReminders(),
      error: () => alert('Failed to update status.')
    });
  }

  getReminderStatus(reminder: Reminder): 'Upcoming' | 'Missed' {
    const today = this.toLocalDateStr(new Date());
    const meetDate = this.toLocalDateStr(new Date(reminder.meeting_date));
    if (meetDate >= today) return 'Upcoming';
    return 'Missed';
  }

  private get scheduledReminders(): Reminder[] {
    return this.reminders.filter(r => r.status !== 'completed');
  }

  get upcomingReminders(): Reminder[] {
    return this.scheduledReminders.filter(r => this.getReminderStatus(r) === 'Upcoming');
  }

  get missedReminders(): Reminder[] {
    return this.scheduledReminders.filter(r => this.getReminderStatus(r) === 'Missed');
  }

  get completedReminders(): Reminder[] {
    return this.reminders.filter(r => r.status === 'completed');
  }

  private toLocalDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}