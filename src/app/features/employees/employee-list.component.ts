import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Employee } from './employee.model';
import { EmployeeService } from './employee.service';
import { Department } from '../department/department.model';
import { DepartmentService } from '../department/department.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {

  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  showAddForm = false;
  editingEmployee: Employee | null = null;
  searchQuery = '';
  departments: Department[] = [];

  newEmployee: Employee = {
    id: 0,
    name: '',
    email: '',
    phone: '',
    department_id: 0,
    position: '',
    join_date: '',
    home_address: '',
    status: 'active',
    issued_items: ''
  };

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
  }

  // ✅ UPDATED — Alphabetical Sorting Added
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        console.log('Loaded employees:', employees);

        // 🔥 SORT ALPHABETICALLY BY NAME
        this.employees = employees.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );

        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        alert('Failed to load employees. Please try again.');
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data.filter(d => d.status === 'active');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load departments', err)
    });
  }

  applyFilter(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredEmployees = [...this.employees];
    } else {
      const lowerQuery = this.searchQuery.toLowerCase();
      this.filteredEmployees = this.employees.filter(emp =>
        emp.name.toLowerCase().includes(lowerQuery) ||
        emp.email.toLowerCase().includes(lowerQuery) ||
        (emp.department_name || '').toLowerCase().includes(lowerQuery) ||
        emp.position.toLowerCase().includes(lowerQuery)
      );
    }
  }

  searchEmployees(): void {
    this.applyFilter();
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  addEmployee(): void {
    if (this.validateForm()) {
      this.employeeService.addEmployee({ ...this.newEmployee }).subscribe({
        next: () => {
          alert('Employee added successfully!');
          this.loadEmployees();
          this.resetForm();
          this.showAddForm = false;
        },
        error: (error) => {
          console.error('Add employee error:', error);
          alert('Failed to add employee.');
        }
      });
    }
  }

  editEmployee(employee: Employee): void {
    const employeeCopy = JSON.parse(JSON.stringify(employee));
    employeeCopy.join_date = this.formatDateForInput(employeeCopy.join_date);

    this.editingEmployee = employeeCopy;
    this.newEmployee = employeeCopy;
    this.showAddForm = true;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateEmployee(): void {
    if (this.editingEmployee && this.validateForm()) {
      this.employeeService.updateEmployee(this.editingEmployee.id, this.newEmployee).subscribe({
        next: () => {
          alert('Employee updated successfully!');
          this.loadEmployees();
          this.resetForm();
          this.showAddForm = false;
        },
        error: (error) => {
          console.error('Update employee error:', error);
          alert('Failed to update employee.');
        }
      });
    }
  }

  deleteEmployee(id: number): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          alert('Employee deleted successfully!');
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Delete employee error:', error);
          alert('Failed to delete employee.');
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.newEmployee.name || !this.newEmployee.email ||
        !this.newEmployee.phone || !this.newEmployee.department_id ||
        !this.newEmployee.position || !this.newEmployee.join_date) {
      alert('Please fill in all required fields');
      return false;
    }

    const phoneDigits = this.newEmployee.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      alert('Phone number must be exactly 10 digits');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newEmployee.email)) {
      alert('Please enter a valid email address');
      return false;
    }

    const duplicateEmail = this.employees.find(emp =>
      emp.email.toLowerCase() === this.newEmployee.email.toLowerCase() &&
      emp.id !== this.editingEmployee?.id
    );
    if (duplicateEmail) {
      alert('An employee with this email already exists');
      return false;
    }

    const newPhoneDigits = this.newEmployee.phone.replace(/\D/g, '');
    const duplicatePhone = this.employees.find(emp => {
      const empPhoneDigits = emp.phone.replace(/\D/g, '');
      return empPhoneDigits === newPhoneDigits &&
             emp.id !== this.editingEmployee?.id;
    });
    if (duplicatePhone) {
      alert('An employee with this phone number already exists');
      return false;
    }

    return true;
  }

  resetForm(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    this.newEmployee = {
      id: 0,
      name: '',
      email: '',
      phone: '',
      department_id: 0,
      position: '',
      join_date: `${year}-${month}-${day}`,
      home_address: '',
      status: 'active',
      issued_items: ''
    };

    this.editingEmployee = null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}