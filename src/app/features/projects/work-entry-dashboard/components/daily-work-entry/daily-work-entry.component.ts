import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface WorkEntry {
  id: number;
  project: string;
  description: string;
  hours: number;
  progress: number;
  date: string;
}

@Component({
  selector: 'app-daily-work-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-work-entry.component.html',
  styleUrls: ['./daily-work-entry.component.css']
})
export class DailyWorkEntryComponent implements OnInit {

  private STORAGE_KEY = 'daily_work_entries';

  /* 🔥 SEND DATA TO DASHBOARD */
  @Output() entriesChange = new EventEmitter<WorkEntry[]>();

  assignedProjects: string[] = [
    'Employee Tracker',
    'Inventory System',
    'Payroll App'
  ];

  // ===== FORM STATE =====
  project = '';
  description = '';
  hours: number | null = null;
  progress = 0;
  date = this.today();

  // ===== EDIT MODE STATE =====
  isEditing = false;
  editingId: number | null = null;

  entries: WorkEntry[] = [];

  /* ===============================
     INIT
  ================================ */
  ngOnInit(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      this.entries = JSON.parse(data);
    }
    this.emitEntries();
  }

  /* ===============================
     ADD / UPDATE
  ================================ */
  addEntry(): void {
    if (!this.project || !this.description || !this.hours) return;

    if (this.isEditing && this.editingId !== null) {
      // UPDATE EXISTING
      const index = this.entries.findIndex(e => e.id === this.editingId);
      if (index !== -1) {
        this.entries[index] = {
          id: this.editingId,
          project: this.project,
          description: this.description,
          hours: this.hours,
          progress: this.progress,
          date: this.date
        };
      }
    } else {
      // ADD NEW
      this.entries.unshift({
        id: Date.now(),
        project: this.project,
        description: this.description,
        hours: this.hours,
        progress: this.progress,
        date: this.date
      });
    }

    this.save();
    this.emitEntries();
    this.resetForm();
  }

  /* ===============================
     EDIT
  ================================ */
  editEntry(entry: WorkEntry): void {
    this.isEditing = true;
    this.editingId = entry.id;

    this.project = entry.project;
    this.description = entry.description;
    this.hours = entry.hours;
    this.progress = entry.progress;
    this.date = entry.date;
  }

  /* ===============================
     DELETE
  ================================ */
  deleteEntry(id: number): void {
    this.entries = this.entries.filter(e => e.id !== id);
    this.save();
    this.emitEntries();

    if (this.editingId === id) {
      this.resetForm();
    }
  }

  /* ===============================
     STORAGE
  ================================ */
  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
  }

  private emitEntries(): void {
    this.entriesChange.emit([...this.entries]);
  }

  /* ===============================
     HELPERS
  ================================ */
  private resetForm(): void {
    this.project = '';
    this.description = '';
    this.hours = null;
    this.progress = 0;
    this.date = this.today();
    this.isEditing = false;
    this.editingId = null;
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
