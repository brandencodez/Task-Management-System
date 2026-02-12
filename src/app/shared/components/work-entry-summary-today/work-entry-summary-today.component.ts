import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { WorkEntryService, WorkEntryStatsToday } from '../../services/work-entry.service';
import { EmployeeService } from '../../../features/employees/employee.service';
import { WorkEntry } from '../../models/work-entry.model';
import { Employee } from '../../../features/employees/employee.model';

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
    employeesWithEntries: [],
    employeesWithoutEntries: []
  };

  workEntriesMap: { [name: string]: WorkEntry[] } = {};
  showModal = false;
  selectedEmployeeName: string | null = null;
  selectedWorkEntries: WorkEntry[] = [];

  private destroy$ = new Subject<void>();
  today: string; // Declare first

  constructor(
    private employeeService: EmployeeService,
    private workEntryService: WorkEntryService,
    private cdr: ChangeDetectorRef
  ) {
    
    this.today = this.getToday();
  }

  ngOnInit(): void {
    interval(5 * 60 * 1000)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => {
        this.today = this.getToday();
        this.loadWorkEntryStats();
      });
  }

  private async loadWorkEntryStats(): Promise<void> {
    try {
      const statsResponse = await this.workEntryService.getWorkSummary().toPromise();
      
      // Handle possible undefined by providing fallbacks
      const stats: WorkEntryStatsToday = {
        totalActiveEmployees: statsResponse?.totalActiveEmployees ?? 0,
        submittedToday: statsResponse?.submittedToday ?? 0,
        notSubmittedToday: statsResponse?.notSubmittedToday ?? 0,
        employeesWithEntries: statsResponse?.employeesWithEntries ?? [],
        employeesWithoutEntries: statsResponse?.employeesWithoutEntries ?? []
      };

      const employeesWithEntries = [...stats.employeesWithEntries];
      const workEntriesMap: { [name: string]: WorkEntry[] } = {};

      for (const emp of employeesWithEntries) {
        const employeeId = await this.getEmployeeIdByName(emp.name);
        if (employeeId) {
          const entries = await this.workEntryService.getEntries(employeeId).toPromise();
          workEntriesMap[emp.name] = entries || []; // Handle possible undefined
        }
      }

      this.stats = {
        ...stats,
        employeesWithEntries: employeesWithEntries.sort((a, b) => a.name.localeCompare(b.name)),
        employeesWithoutEntries: [...stats.employeesWithoutEntries].sort((a, b) => a.name.localeCompare(b.name))
      };
      this.workEntriesMap = workEntriesMap;

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to load work summary:', error);
      this.resetStats();
    }
  }

  private getEmployeeIdByName(name: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.employeeService.getEmployees().subscribe({
        next: (employees: Employee[]) => {
          const emp = employees.find(e => e.name === name);
          resolve(emp ? String(emp.id) : null);
        },
        error: () => resolve(null)
      });
    });
  }

  openWorkEntriesModal(employeeName: string): void {
    this.selectedEmployeeName = employeeName;
    this.selectedWorkEntries = this.workEntriesMap[employeeName] || [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedEmployeeName = null;
    this.selectedWorkEntries = [];
  }

  // Define helper method
  getAttachmentUrl(filename: string): string {
    return this.workEntryService.getAttachmentUrl(filename);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  }

  private resetStats(): void {
    this.stats = {
      totalActiveEmployees: 0,
      submittedToday: 0,
      notSubmittedToday: 0,
      employeesWithEntries: [],
      employeesWithoutEntries: []
    };
    this.workEntriesMap = {};
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Define getToday as a method
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
}