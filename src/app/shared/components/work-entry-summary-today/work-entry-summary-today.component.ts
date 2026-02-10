import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, delay } from 'rxjs/operators';
import { WorkEntryService, WorkEntryStatsToday } from '../../services/work-entry.service';
import { EmployeeService } from '../../../features/employees/employee.service'; // ✅ Keep this

@Component({
  selector: 'app-work-entry-summary-today',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-entry-summary-today.component.html',
  styleUrls: ['./work-entry-summary-today.component.css']
})
export class WorkEntrySummaryTodayComponent implements OnInit, OnDestroy {

  stats: WorkEntryStatsToday = {
    totalActiveEmployees: 0,
    submittedToday: 0,
    notSubmittedToday: 0,
    submittedPercentage: 0,
    employeesWithEntries: [],
    employeesWithoutEntries: []
  };

  showDetailsList = false;
  selectedTab: 'submitted' | 'notSubmitted' = 'submitted';

  private destroy$ = new Subject<void>();
  private today = this.getToday();

  constructor(
    private employeeService: EmployeeService,
    private workEntryService: WorkEntryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Refresh every 5 minutes to keep data current
    interval(5 * 60 * 1000)
      .pipe(
        startWith(0),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.today = this.getToday();
        this.loadWorkEntryStats();
      });
  }

  /**
   * Load work entry statistics for today
   */
  private loadWorkEntryStats(): void {
    this.workEntryService.getWorkSummary().pipe(
    ).subscribe({
      next: (stats) => {
        this.stats = {
          ...stats,
          employeesWithEntries: [...stats.employeesWithEntries].sort(),
          employeesWithoutEntries: [...stats.employeesWithoutEntries].sort()
        };
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load work summary:', error);
        this.stats = {
          totalActiveEmployees: 0,
          submittedToday: 0,
          notSubmittedToday: 0,
          submittedPercentage: 0,
          employeesWithEntries: [],
          employeesWithoutEntries: []
        };
        
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Toggle details list visibility
   */
  toggleDetailsList(): void {
    this.showDetailsList = !this.showDetailsList;
  }

  /**
   * Switch between submitted and not submitted tabs
   */
  switchTab(tab: 'submitted' | 'notSubmitted'): void {
    this.selectedTab = tab;
  }

  /**
   * Get progress bar color based on percentage
   */
  getProgressColor(): string {
    if (this.stats.submittedPercentage >= 80) return '#28a745'; 
    if (this.stats.submittedPercentage >= 60) return '#ffc107'; 
    if (this.stats.submittedPercentage >= 40) return '#fd7e14'; 
    return '#dc3545'; // Red
  }

  /**
   * Get status message
   */
  getStatusMessage(): string {
    const { submittedToday, notSubmittedToday, totalActiveEmployees } = this.stats;

    if (submittedToday === totalActiveEmployees) {
      return '✅ All employees have submitted work entries!';
    } else if (submittedToday === 0) {
      return '⚠️ No work entries submitted yet today';
    } else {
      return `${notSubmittedToday} employee${notSubmittedToday > 1 ? 's' : ''} pending`;
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Refresh statistics manually
   */
  refreshStats(): void {
    this.loadWorkEntryStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}