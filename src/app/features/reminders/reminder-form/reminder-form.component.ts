import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReminderService } from '../reminder.service';
import { EmployeeService } from '../../employees/employee.service';
import { Employee } from '../../employees/employee.model';
import { DepartmentService } from '../../department/department.service';
import { Department } from '../../department/department.model';
import { Reminder } from '../../../shared/models/reminder.model';

@Component({
  selector: 'app-reminder-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reminder-form.component.html',
  styleUrls: ['./reminder-form.component.css']
})
export class ReminderFormComponent implements OnInit, OnChanges {
  @Output() reminderSaved = new EventEmitter<void>();
  @Input() editingReminder: Reminder | null = null;

  employees: Employee[] = [];
  departments: Department[] = [];
  employeeId: number | null = null;

  title = '';
  purpose = '';
  department = '';
  clientName = '';
  contactType: 'email' | 'phone' = 'email';
  clientContact = '';
  meetingLink = '';
  meetingDate = '';
  meetingTime = '';
  remindOn = '';

  get isEditing(): boolean {
    return !!this.editingReminder;
  }

  constructor(
    private reminderService: ReminderService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.employeeService.getEmployees().subscribe((employees: Employee[]) => {
      this.employees = employees;
    });
    this.departmentService.getDepartments().subscribe((departments: Department[]) => {
      this.departments = departments;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingReminder'] && this.editingReminder) {
      this.populateForm(this.editingReminder);
    }
  }

  private populateForm(r: Reminder): void {
    this.employeeId = r.employee_id;
    this.title = r.title;
    this.purpose = r.purpose;
    this.department = r.department;
    this.clientName = r.client_name;
    this.meetingLink = r.meeting_link || '';

    // Detect contact type
    if (r.client_contact && /^\d{10}$/.test(r.client_contact)) {
      this.contactType = 'phone';
    } else {
      this.contactType = 'email';
    }
    this.clientContact = r.client_contact;

    // Leave date/time/remind-on blank for user to re-enter
    this.meetingDate = '';
    this.meetingTime = '';
    this.remindOn = '';
  }

  saveReminder(): void {
    if (!this.employeeId || !this.validateForm()) return;

    const meetingDatetime = (this.meetingDate && this.meetingTime)
      ? `${this.meetingDate} ${this.meetingTime}:00`
      : (this.meetingDate ? `${this.meetingDate} 09:00:00` : undefined);

    const reminder = {
      employee_id: this.employeeId,
      title: this.title,
      purpose: this.purpose,
      department: this.department,
      client_name: this.clientName,
      client_contact: this.clientContact,
      meeting_link: this.meetingLink,
      meeting_date: this.meetingDate,
      meeting_datetime: meetingDatetime,
      remind_on: this.remindOn
    };

    if (this.isEditing) {
      this.reminderService.updateReminder(this.editingReminder!.id, reminder).subscribe({
        next: () => {
          this.resetForm();
          this.reminderSaved.emit();
          setTimeout(() => alert('Reminder updated successfully!'));
        },
        error: (error) => {
          console.error('Update reminder error:', error);
          alert('Failed to update reminder. Please try again.');
        }
      });
    } else {
      this.reminderService.addReminder(reminder).subscribe({
        next: () => {
          this.resetForm();
          this.reminderSaved.emit();
          setTimeout(() => alert('Reminder added successfully!'));
        },
        error: (error) => {
          console.error('Add reminder error:', error);
          alert('Failed to add reminder. Please try again.');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingReminder = null;
    this.resetForm();
  }

  private validateForm(): boolean {
    if (!this.title || !this.meetingDate || !this.remindOn) {
      alert('Please fill all required fields');
      return false;
    }
    if (new Date(this.remindOn) > new Date(this.meetingDate)) {
      alert('Remind date must be before or on meeting date');
      return false;
    }
    return true;
  }

  private resetForm(): void {
    this.employeeId = null;
    this.title = '';
    this.purpose = '';
    this.department = '';
    this.clientName = '';
    this.contactType = 'email';
    this.clientContact = '';
    this.meetingLink = '';
    this.meetingDate = '';
    this.meetingTime = '';
    this.remindOn = '';
  }
}