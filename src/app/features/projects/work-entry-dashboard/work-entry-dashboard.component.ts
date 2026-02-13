import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyWorkEntryComponent } from './components/daily-work-entry/daily-work-entry.component';
import { WorkEntry } from '../../../shared/models/work-entry.model';
import { ProjectService } from '../../projects/project.service';
import { EmployeeService } from '../../employees/employee.service';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-work-entry-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DailyWorkEntryComponent
  ],
  templateUrl: './work-entry-dashboard.component.html',
  styleUrls: ['./work-entry-dashboard.component.css']
})
export class WorkEntryDashboardComponent implements OnInit {

  totalEntries = 0;
  todayEntries = 0;
  weekEntries = 0;

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private userService: UserService
  ) {}

  ngOnInit(): void {

  }

  onEntriesChange(entries: WorkEntry[]): void {
    this.totalEntries = entries.length;
    this.todayEntries = this.countToday(entries);
    this.weekEntries = this.countThisWeek(entries);
  }

  private countToday(entries: WorkEntry[]): number {
    const today = this.getToday();
    return entries.filter(e => this.normalizeDate(e.date) === today).length;
  }

  private countThisWeek(entries: WorkEntry[]): number {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);

    return entries.filter(e => {
      const dateStr = this.normalizeDate(e.date);
      const [year, month, day] = dateStr.split('-').map(Number);
      const entryDate = new Date(year, month - 1, day); 
      return entryDate >= start && entryDate <= today;
    }).length;
  }

  private normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    // Already YYYY-MM-DD
    if (dateStr.length === 10) return dateStr;
    // Parse ISO string and extract LOCAL date to handle timezone shifts
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // e.g. "2026-02-12"
  }
}