import { Injectable } from '@angular/core';
import { Employee } from './employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private storageKey = 'employees';
  private employees: Employee[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedData = localStorage.getItem(this.storageKey);
    if (storedData) {
      this.employees = JSON.parse(storedData);
      // Convert string dates back to Date objects
      this.employees = this.employees.map(emp => ({
        ...emp,
        joinDate: new Date(emp.joinDate)
      }));
    } else {
      // Initialize with default employees if no data exists
      this.employees = [
        {
          id: '1',
          name: 'Rahul Kumar',
          email: 'rahul@example.com',
          phone: '+91-9876543210',
          department: 'Development',
          position: 'Senior Developer',
          joinDate: new Date('2023-01-15'),
          status: 'active'
        },
        {
          id: '2',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+91-9876543211',
          department: 'HR',
          position: 'HR Manager',
          joinDate: new Date('2022-06-20'),
          status: 'active'
        }
      ];
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.employees));
  }

  getEmployees(): Employee[] {
    return this.employees;
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.employees.find(emp => emp.id === id);
  }

  addEmployee(employee: Employee): void {
    this.employees.push(employee);
    this.saveToStorage();
  }

  updateEmployee(id: string, employee: Employee): void {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index] = employee;
      this.saveToStorage();
    }
  }

  deleteEmployee(id: string): void {
    this.employees = this.employees.filter(emp => emp.id !== id);
    this.saveToStorage();
  }

  searchEmployees(query: string): Employee[] {
    const lowerQuery = query.toLowerCase();
    return this.employees.filter(emp => 
      emp.name.toLowerCase().includes(lowerQuery) ||
      emp.email.toLowerCase().includes(lowerQuery) ||
      emp.department.toLowerCase().includes(lowerQuery) ||
      emp.position.toLowerCase().includes(lowerQuery)
    );
  }

  // Optional: Clear all data
  clearAllEmployees(): void {
    this.employees = [];
    this.saveToStorage();
  }
}