import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee } from './employee.model';
import { EmployeeService } from './employee.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  showAddForm = false;
  editingEmployee: Employee | null = null;
  searchQuery = '';

  newEmployee: Employee = {
    id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    joinDate: new Date(),
    status: 'active'
  };

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employees = this.employeeService.getEmployees();
    this.filteredEmployees = [...this.employees];
  }

 searchEmployees(): void {
  if (this.searchQuery.trim() === '') {
    this.filteredEmployees = [...this.employees];
  } else {
    const lowerQuery = this.searchQuery.toLowerCase();
    this.filteredEmployees = this.employees.filter(emp => 
      emp.name.toLowerCase().includes(lowerQuery) ||
      emp.email.toLowerCase().includes(lowerQuery) ||
      emp.department.toLowerCase().includes(lowerQuery) ||
      emp.position.toLowerCase().includes(lowerQuery)
    );
  }
}

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  addEmployee(): void {
    if (this.validateForm()) {
      this.newEmployee.id = Date.now().toString();
      this.employeeService.addEmployee({ ...this.newEmployee });
      this.loadEmployees();
      this.resetForm();
      this.showAddForm = false;
    }
  }

  editEmployee(employee: Employee): void {
    this.editingEmployee = { ...employee };
    this.newEmployee = { ...employee };
    this.showAddForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateEmployee(): void {
    if (this.editingEmployee && this.validateForm()) {
      this.employeeService.updateEmployee(this.editingEmployee.id, this.newEmployee);
      this.loadEmployees();
      this.resetForm();
      this.showAddForm = false;
    }
  }

  deleteEmployee(id: string): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id);
      this.loadEmployees();
    }
  }

  validateForm(): boolean {
    if (!this.newEmployee.name || !this.newEmployee.email || 
        !this.newEmployee.phone || !this.newEmployee.department || 
        !this.newEmployee.position) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  }

  resetForm(): void {
    this.newEmployee = {
      id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      joinDate: new Date(),
      status: 'active'
    };
    this.editingEmployee = null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}