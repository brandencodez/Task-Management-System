import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Employee } from './employee.model';
import { EmployeeService } from './employee.service';

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

  newEmployee: Employee = {
    id: 0,
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    join_date: '',
    home_address: '',
    status: 'active',
    issued_items: ''
  };

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        console.log('Loaded employees:', employees);
        this.employees = employees;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        alert('Failed to load employees. Please try again.');
      }
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
        emp.department.toLowerCase().includes(lowerQuery) ||
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

  // Helper to ensure proper date format for HTML date input
  private ensureValidDate(dateString: string): string {
    if (dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's a valid date but in different format, convert it
    if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // If invalid or empty, return today's date
    return new Date().toISOString().split('T')[0];
  }

  // Format YYYY-MM-DD to DD-MM-YY for display
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const shortYear = year.slice(-2); 
      return `${day}-${month}-${shortYear}`;
    }
    return dateString;
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
          alert('Failed to add employee. Please check all fields and try again.');
        }
      });
    }
  }

  // FIXED: Ensure proper date format when editing
  editEmployee(employee: Employee): void {
    // Create a proper deep copy using JSON.parse(JSON.stringify())
    const employeeCopy = JSON.parse(JSON.stringify(employee));
    employeeCopy.join_date = this.ensureValidDate(employeeCopy.join_date);
    
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
          alert('Failed to update employee. Please try again.');
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
          alert('Failed to delete employee. Please try again.');
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.newEmployee.name || !this.newEmployee.email ||
        !this.newEmployee.phone || !this.newEmployee.department ||
        !this.newEmployee.position || !this.newEmployee.join_date) {
      alert('Please fill in all required fields');
      return false;
    }

    // Validate phone number is exactly 10 digits
    const phoneDigits = this.newEmployee.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      alert('Phone number must be exactly 10 digits');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newEmployee.email)) {
      alert('Please enter a valid email address');
      return false;
    }

    // Check for duplicate email (exclude current employee when editing)
    const duplicateEmail = this.employees.find(emp => 
      emp.email.toLowerCase() === this.newEmployee.email.toLowerCase() &&
      emp.id !== this.editingEmployee?.id
    );
    if (duplicateEmail) {
      alert('An employee with this email already exists');
      return false;
    }

    // Check for duplicate phone (exclude current employee when editing)
    const newPhoneDigits = this.newEmployee.phone.replace(/\D/g, '');
    const duplicatePhone = this.employees.find(emp => {
      const empPhoneDigits = emp.phone.replace(/\D/g, '');
      return empPhoneDigits === newPhoneDigits && emp.id !== this.editingEmployee?.id;
    });
    if (duplicatePhone) {
      alert('An employee with this phone number already exists');
      return false;
    }

    return true;
  }

  resetForm(): void {
    this.newEmployee = {
      id: 0,
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      join_date: new Date().toISOString().split('T')[0], 
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