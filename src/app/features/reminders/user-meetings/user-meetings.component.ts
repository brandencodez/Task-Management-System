import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReminderService } from '../reminder.service';
import { UserService } from '../../../shared/services/user.service';
import { Reminder } from '../../../shared/models/reminder.model';

@Component({
  selector: 'app-user-meetings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-meetings.component.html',
  styleUrls: ['./user-meetings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserMeetingsComponent implements OnInit {
  reminders: Reminder[] = [];
  isLoading = true;
  private employeeId!: number;

  constructor(
    private reminderService: ReminderService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.userService.getCurrentUserId();
    if (!userId) {
      this.router.navigate(['/user-login']);
      return;
    }
    this.employeeId = +userId;
    this.loadMeetings(this.employeeId);
  }

  loadMeetings(employeeId: number): void {
    this.isLoading = true;

    this.reminderService.getMyMeetings(employeeId).subscribe({
      next: (reminders) => {
        this.reminders = reminders;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getMeetingStatus(reminder: Reminder): 'Upcoming' | 'Missed' {
    const today = this.toLocalDateStr(new Date());
    const meetDate = this.toLocalDateStr(new Date(reminder.meeting_date));
    if (meetDate >= today) return 'Upcoming';
    return 'Missed';
  }

  private toLocalDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  get scheduledReminders(): Reminder[] {
    return this.reminders.filter(r => r.status !== 'completed');
  }

  get upcomingMeetings(): Reminder[] {
    return this.scheduledReminders.filter(r => this.getMeetingStatus(r) === 'Upcoming');
  }

  get missedMeetings(): Reminder[] {
    return this.scheduledReminders.filter(r => this.getMeetingStatus(r) === 'Missed');
  }

  get completedMeetings(): Reminder[] {
    return this.reminders.filter(r => r.status === 'completed');
  }
}
