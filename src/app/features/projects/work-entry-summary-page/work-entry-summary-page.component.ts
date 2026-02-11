import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkEntryService, WorkEntryStatsToday } from '../../../shared/services/work-entry.service';
import { interval, Subject } from 'rxjs';
import { takeUntil, delay } from 'rxjs/operators';

@Component({
  selector: 'app-work-entry-summary-page',
  templateUrl: './work-entry-summary-page.component.html',
  styleUrls: ['./work-entry-summary-page.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class WorkEntrySummaryPageComponent implements OnInit, OnDestroy {
  stats: WorkEntryStatsToday = {
    totalActiveEmployees: 0,
    submittedToday: 0,
    notSubmittedToday: 0,
    employeesWithEntries: [],
    employeesWithoutEntries: []
  };

  showDetails = false;
  activeTab: 'submitted' | 'pending' = 'submitted';
  today = this.getToday();
  private destroy$ = new Subject<void>();
  isLoading = true;

  constructor(
    private workEntryService: WorkEntryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Auto-refresh every 5 minutes
    interval(5 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadWorkEntryStats();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getToday(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  private loadWorkEntryStats(): void {
    this.isLoading = true;
    
    
    this.workEntryService.getWorkSummary().pipe(
    ).subscribe({
      next: (stats) => {
        this.stats = {
          ...stats,
          employeesWithEntries: [...stats.employeesWithEntries].sort(),
          employeesWithoutEntries: [...stats.employeesWithoutEntries].sort()
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load work summary:', error);
        this.stats = {
          totalActiveEmployees: 0,
          submittedToday: 0,
          notSubmittedToday: 0,
          employeesWithEntries: [],
          employeesWithoutEntries: []
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleDetailsList(): void {
    this.showDetails = !this.showDetails;
  }

  switchTab(tab: 'submitted' | 'pending'): void {
    this.activeTab = tab;
  }
  
  getStatusMessage(): string {
    if (this.stats.notSubmittedToday === 0) {
      return '✅ All employees have submitted work entries!';
    }
    if (this.stats.submittedToday === 0) {
      return '⚠️ No work entries submitted yet today';
    }
    return `${this.stats.notSubmittedToday} employees pending`;
  }

  manualRefresh(): void {
    this.loadWorkEntryStats();
  }
}