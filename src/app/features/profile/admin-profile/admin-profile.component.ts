import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../admins/admin.service';
import { Admin } from '../../admins/admin.model';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css']
})
export class AdminProfileComponent implements OnInit {
  adminId: number | null = null;
  admin: Admin | null = null;
  isLoading = true;
  isSaving = false;
  saveMessage = '';
  isEditMode = false;

  profileForm = {
    full_name: '',
    gender: 'male' as 'male' | 'female',
    profile_image: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
    bio: '',
    date_of_birth: ''
  };

  constructor(
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const currentAdmin = this.adminService.getCurrentAdmin();
    if (!currentAdmin) {
      this.router.navigate(['/admin-login']);
      return;
    }

    this.adminId = currentAdmin.id;
    this.loadProfile();
  }

  loadProfile() {
    if (!this.adminId) return;
    this.isLoading = true;

    this.adminService.getAdminById(this.adminId).subscribe({
      next: (admin) => {
        this.admin = admin;
        this.profileForm.full_name = admin?.full_name || '';
        this.profileForm.gender = (admin?.gender as 'male' | 'female') || 'male';
        this.profileForm.profile_image = admin?.profile_image || '';
        this.profileForm.email = admin?.email || '';
        this.profileForm.status = admin?.status || 'active';
        this.profileForm.bio = admin?.bio || '';
        this.profileForm.date_of_birth = this.normalizeDateForInput(admin?.date_of_birth || '');
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
    const name = this.profileForm.full_name.trim();
    return name || this.admin?.full_name || 'Admin';
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
    if (!this.adminId) return;
    this.isSaving = true;
    this.saveMessage = '';

    const normalizedDob = this.normalizeDateForInput(this.profileForm.date_of_birth);

    this.adminService.updateAdminProfile(this.adminId, {
      full_name: this.profileForm.full_name.trim(),
      gender: this.profileForm.gender,
      profile_image: this.profileForm.profile_image,
      email: this.profileForm.email.trim(),
      status: this.profileForm.status,
      bio: this.profileForm.bio.trim(),
      date_of_birth: normalizedDob || undefined
    }).subscribe({
      next: (updated) => {
        this.admin = updated;
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
