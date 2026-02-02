import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReminderService, Reminder } from '../reminder.service';
import { EmployeeService } from '../../employees/employee.service';
import { Employee } from '../../employees/employee.model';

@Component({
  selector: 'app-reminder-form',
  standalone: true,

  // ✅ REQUIRED MODULES FOR ngModel, ngFor, ngValue
  imports: [CommonModule, FormsModule],

  templateUrl: './reminder-form.component.html',
  styleUrls: ['./reminder-form.component.css']
})
export class ReminderFormComponent implements OnInit {

  // ================= EMPLOYEE =================
  employees: any[] = [];
  employeeId: number | null = null;

  // ================= FORM FIELDS =================
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
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    // ✅ Load employees created in Employee Management
   this.employeeService.getEmployees().subscribe((employees: Employee[]) => {
  this.employees = employees; // Assign inside subscribe callback
});
  }

  addReminder(): void {
    if (!this.employeeId) return;

    const selectedEmployee = this.employees.find(
      e => e.id === this.employeeId
    );

    if (!selectedEmployee) return;

    const reminder: Reminder = {
      id: Date.now(),

      // ✅ REQUIRED BY Reminder INTERFACE
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,

      title: this.title,
      purpose: this.purpose,
      department: this.department,
      clientName: this.clientName,
      clientContact: this.clientContact,
      meetingLink: this.meetingLink,
      meetingDate: this.meetingDate,
      remindOn: this.remindOn
    };

    this.reminderService.addReminder(reminder);

    // ================= RESET FORM =================
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
