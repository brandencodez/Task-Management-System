import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Department } from './department.model';
import { DepartmentService } from './department.service';
@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.css']
})
export class DepartmentListComponent implements OnInit {

  departments: Department[] = [];
  filteredDepartments: Department[] = [];

  showAddForm = false;
  editingDepartment: Department | null = null;
  searchQuery = '';

  newDepartment: Department = {
    id: 0,
    name: '',
    description: '',
    status: 'active',
    project_count: 0,
    employee_count: 0
  };

  constructor(
    private departmentService: DepartmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        alert('Failed to load departments');
      }
    });
  }

  applyFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredDepartments = [...this.departments];
      return;
    }

    const q = this.searchQuery.toLowerCase();
    this.filteredDepartments = this.departments.filter(dep =>
      dep.name.toLowerCase().includes(q) ||
      (dep.description || '').toLowerCase().includes(q)
    );
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  addDepartment(): void {
    if (!this.validateForm()) return;

    this.departmentService.addDepartment(this.newDepartment).subscribe({
      next: () => {
        alert('Department added successfully!');
        this.loadDepartments();
        this.resetForm();
        this.cdr.detectChanges();
        this.showAddForm = false;
      },
      error: (error) => {
        console.error('Add department error:', error);
        alert(error.error?.error || 'Failed to add department');
      }
    });
  }

  editDepartment(department: Department): void {
    this.editingDepartment = { ...department };
    this.newDepartment = { ...department };
    this.showAddForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

 updateDepartment(): void {
  if (!this.editingDepartment || !this.validateForm()) return;

  this.departmentService
    .updateDepartment(this.editingDepartment.id, this.newDepartment)
    .subscribe({
      next: () => {
        alert('Department updated successfully!');
        this.resetForm();
        this.showAddForm = false;
        this.loadDepartments();
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        console.error('Update department error:', error);
        alert(error.error?.error || 'Failed to update department');
      }
    });
}
  toggleStatus(department: Department): void {
    const action = department.status === 'active'
      ? this.departmentService.disableDepartment(department.id)
      : this.departmentService.enableDepartment(department.id);

    action.subscribe({
      next: () => {
        this.loadDepartments();
      },
      error: (error) => {
        console.error('Toggle status error:', error);
        alert('Failed to update department status');
      }
    });
  }

  validateForm(): boolean {
    if (!this.newDepartment.name) {
      alert('Department name is required');
      return false;
    }

    const duplicate = this.departments.find(dep =>
      dep.name.toLowerCase() === this.newDepartment.name.toLowerCase() &&
      dep.id !== this.editingDepartment?.id
    );

    if (duplicate) {
      alert('Department with this name already exists');
      return false;
    }

    return true;
  }

  enableDepartment(departmentId: number): void {
  if (!confirm('Are you sure you want to enable this department?')) {
    return;
  }

  this.departmentService.enableDepartment(departmentId).subscribe({
    next: () => {
      // Update UI immediately or reload list
      this.loadDepartments();
    },
    error: (error) => {
      console.error('Enable department error:', error);
      alert('Failed to enable department');
    }
  });
}

disableDepartment(departmentId: number): void {
  if (!confirm('Are you sure you want to disable this department?')) {
    return;
  }

  this.departmentService.disableDepartment(departmentId).subscribe({
    next: () => {
      this.loadDepartments(); // refresh table
    },
    error: (error) => {
      console.error('Disable department error:', error);
      alert('Failed to disable department');
    }
  });
}


  resetForm(): void {
    this.newDepartment = {
      id: 0,
      name: '',
      description: '',
      status: 'active',
      project_count: 0,
      employee_count: 0
    };
    this.editingDepartment = null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
