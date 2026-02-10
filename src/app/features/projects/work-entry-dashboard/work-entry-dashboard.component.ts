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
    return entries.filter(e => e.date === today).length;
  }

  private countThisWeek(entries: WorkEntry[]): number {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 6);

    return entries.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= today;
    }).length;
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
}