import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../employees/employee.service';
import { DepartmentService } from '../../department/department.service';
import { UserService } from '../../../shared/services/user.service';
import { Employee } from '../../employees/employee.model';
import { Department } from '../../department/department.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  employeeId: number | null = null;
  employee: Employee | null = null;
  isLoading = true;
  isSaving = false;
  saveMessage = '';
  isEditMode = false;
  departments: Department[] = [];

  profileForm = {
    name: '',
    gender: 'male' as 'male' | 'female',
    profile_image: '',
    email: '',
    phone: '',
    department_id: 0,
    position: '',
    home_address: '',
    bio: '',
    date_of_birth: ''
  };

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const storedId = this.userService.getCurrentUserId();
    if (!storedId) {
      this.router.navigate(['/user-login']);
      return;
    }

    this.employeeId = Number(storedId);
    this.loadProfile();
  }

  loadProfile() {
    if (!this.employeeId) return;
    this.isLoading = true;

    forkJoin({
      employee: this.employeeService.getEmployeeById(this.employeeId),
      departments: this.departmentService.getActiveDepartments()
    }).subscribe({
      next: ({ employee, departments }) => {
        this.employee = employee || null;
        this.departments = departments || [];
        this.profileForm.name = employee?.name || '';
        this.profileForm.gender = (employee?.gender as 'male' | 'female') || 'male';
        this.profileForm.profile_image = employee?.profile_image || '';
        this.profileForm.email = employee?.email || '';
        this.profileForm.phone = employee?.phone || '';
        this.profileForm.department_id = employee?.department_id || 0;
        this.profileForm.position = employee?.position || '';
        this.profileForm.home_address = employee?.home_address || '';
        this.profileForm.bio = employee?.bio || '';
        this.profileForm.date_of_birth = this.normalizeDateForInput(employee?.date_of_birth || '');
        this.isLoading = false;
        this.isEditMode = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get displayName(): string {
    const name = this.profileForm.name.trim();
    return name || this.employee?.name || 'User';
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.profileForm.profile_image = String(reader.result || '');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  clearPhoto() {
    this.profileForm.profile_image = '';
    this.cdr.detectChanges();
  }

  saveProfile() {
    if (!this.employeeId) return;
    this.isSaving = true;
    this.saveMessage = '';

    const normalizedDob = this.normalizeDateForInput(this.profileForm.date_of_birth);

    this.employeeService.updateEmployeeProfile(this.employeeId, {
      name: this.profileForm.name.trim(),
      gender: this.profileForm.gender,
      profile_image: this.profileForm.profile_image,
      email: this.profileForm.email.trim(),
      phone: this.profileForm.phone.trim(),
      department_id: this.profileForm.department_id || undefined,
      position: this.profileForm.position.trim(),
      home_address: this.profileForm.home_address.trim(),
      bio: this.profileForm.bio.trim(),
      date_of_birth: normalizedDob || undefined
    }).subscribe({
      next: (updated) => {
        this.employee = updated;
        this.isSaving = false;
        this.isEditMode = false;
        this.saveMessage = 'Profile updated successfully.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSaving = false;
        this.saveMessage = 'Failed to update profile.';
        this.cdr.detectChanges();
      }
    });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.loadProfile();
  }

  private normalizeDateForInput(value: string): string {
    if (!value) return '';
    return value.includes('T') ? value.slice(0, 10) : value;
  }
}
