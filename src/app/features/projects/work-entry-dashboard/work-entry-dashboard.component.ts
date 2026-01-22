import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DailyWorkEntryComponent,
  WorkEntry
} from './components/daily-work-entry/daily-work-entry.component';

@Component({
  selector: 'app-work-entry-dashboard',
  standalone: true,
  imports: [CommonModule, DailyWorkEntryComponent],
  templateUrl: './work-entry-dashboard.component.html',
  styleUrls: ['./work-entry-dashboard.component.css']
})
export class WorkEntryDashboardComponent {

  totalEntries = 0;
  todayEntries = 0;
  weekEntries = 0;

  /* ===============================
     RECEIVE ENTRIES FROM CHILD
  ================================ */
  onEntriesChange(entries: WorkEntry[]): void {
    this.totalEntries = entries.length;
    this.todayEntries = this.countToday(entries);
    this.weekEntries = this.countThisWeek(entries);
  }

  /* ===============================
     CALCULATIONS
  ================================ */
  private countToday(entries: WorkEntry[]): number {
    const today = this.getToday();
    return entries.filter(e => e.date === today).length;
  }

  private countThisWeek(entries: WorkEntry[]): number {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 6); // last 7 days

    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= startOfWeek && entryDate <= today;
    }).length;
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
}
