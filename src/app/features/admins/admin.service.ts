import { Injectable } from '@angular/core';
import { Admin } from './admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private storageKey = 'admins';
  private currentAdminKey = 'currentAdmin';
  private admins: Admin[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedData = localStorage.getItem(this.storageKey);
    if (storedData) {
      this.admins = JSON.parse(storedData);
      // Convert string dates back to Date objects
      this.admins = this.admins.map(admin => ({
        ...admin,
        joinDate: new Date(admin.joinDate)
      }));
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.admins));
  }

  // Check if an admin exists by email
  adminExists(email: string): boolean {
    return this.admins.some(admin => 
      admin.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Register a new admin
  registerAdmin(name: string, email: string, password: string): boolean {
    if (this.adminExists(email)) {
      return false;
    }

    const newAdmin: Admin = {
      id: Date.now().toString(),
      name: name,
      email: email,
      phone: '',  // Default empty, can be updated later
      department: 'Administration',  // Default department
      position: 'Admin',  // Default position
      joinDate: new Date(),
      HomeAddress: '',  // Default empty
      status: 'active'
    };

    this.admins.push(newAdmin);
    this.saveToStorage();

    // Store password separately (in production, this should be hashed)
    this.setPassword(email, password);
    
    return true;
  }

  // Validate admin credentials
  validateCredentials(email: string, password: string): boolean {
    const storedPassword = localStorage.getItem(`admin_pwd_${email.toLowerCase()}`);
    return storedPassword === password;
  }

  // Set/update password for admin
  private setPassword(email: string, password: string): void {
    localStorage.setItem(`admin_pwd_${email.toLowerCase()}`, password);
  }

  // Get admin by email
  getAdminByEmail(email: string): Admin | undefined {
    return this.admins.find(admin => 
      admin.email.toLowerCase() === email.toLowerCase()
    );
  }

  // Set current logged-in admin
  setCurrentAdmin(email: string): void {
    const admin = this.getAdminByEmail(email);
    if (admin) {
      localStorage.setItem(this.currentAdminKey, JSON.stringify(admin));
    }
  }

  // Get current logged-in admin
  getCurrentAdmin(): Admin | null {
    const storedAdmin = localStorage.getItem(this.currentAdminKey);
    if (storedAdmin) {
      const admin = JSON.parse(storedAdmin);
      admin.joinDate = new Date(admin.joinDate);
      return admin;
    }
    return null;
  }

  // Check if an admin is logged in
  isLoggedIn(): boolean {
    return this.getCurrentAdmin() !== null;
  }

  // Logout current admin
  logoutAdmin(): void {
    localStorage.removeItem(this.currentAdminKey);
  }

  // Get all admins (for admin management if needed)
  getAdmins(): Admin[] {
    return this.admins;
  }

  // Update admin profile
  updateAdmin(id: string, adminData: Partial<Admin>): boolean {
    const index = this.admins.findIndex(admin => admin.id === id);
    if (index !== -1) {
      this.admins[index] = { ...this.admins[index], ...adminData };
      this.saveToStorage();
      
      // Update current admin if it's the same one
      const currentAdmin = this.getCurrentAdmin();
      if (currentAdmin && currentAdmin.id === id) {
        this.setCurrentAdmin(this.admins[index].email);
      }
      return true;
    }
    return false;
  }

  // Change password
  changePassword(email: string, oldPassword: string, newPassword: string): boolean {
    if (this.validateCredentials(email, oldPassword)) {
      this.setPassword(email, newPassword);
      return true;
    }
    return false;
  }
}