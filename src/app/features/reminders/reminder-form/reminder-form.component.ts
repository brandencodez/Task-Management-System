import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReminderService } from '../reminder.service';
import { EmployeeService } from '../../employees/employee.service';
import { Employee } from '../../employees/employee.model';
import { DepartmentService } from '../../department/department.service';
import { Department } from '../../department/department.model';

@Component({
  selector: 'app-reminder-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reminder-form.component.html',
  styleUrls: ['./reminder-form.component.css']
})
export class ReminderFormComponent implements OnInit {
  employees: Employee[] = [];
  departments: Department[] = [];
  employeeId: number | null = null;

  title = '';
  purpose = '';
  department = '';
  clientName = '';
  clientContact = '';
  meetingLink = '';
  meetingDate = '';
  remindOn = '';

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

  addReminder(): void {
    if (!this.employeeId || !this.validateForm()) return;

    const reminder = {
      employee_id: this.employeeId,
      title: this.title,
      purpose: this.purpose,
      department: this.department,
      client_name: this.clientName,
      client_contact: this.clientContact,
      meeting_link: this.meetingLink,
      meeting_date: this.meetingDate,
      remind_on: this.remindOn
    };

    this.reminderService.addReminder(reminder).subscribe({
      next: () => {
        alert('Reminder added successfully!');
        this.resetForm();
      },
      error: (error) => {
        console.error('Add reminder error:', error);
        alert('Failed to add reminder. Please try again.');
      }
    });
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
    this.clientContact = '';
    this.meetingLink = '';
    this.meetingDate = '';
    this.remindOn = '';
  }
}