import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Admin } from './admin.model';

interface LoginResponse {
  success: boolean;
  message?: string;
  admin: Admin;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  admin: Admin;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = 'http://localhost:5000/api/admins';
  private ADMIN_KEY = 'current_admin';
  private ADMIN_EMAIL_KEY = 'current_admin_email';
  
  // Observable for components to subscribe to login state changes
  private currentAdminSubject = new BehaviorSubject<Admin | null>(this.getCurrentAdmin());
  public currentAdmin$ = this.currentAdminSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize the subject with stored admin if exists
    this.currentAdminSubject.next(this.getCurrentAdmin());
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // ✅ Register Admin
  registerAdmin(full_name: string, email: string, password: string): Observable<Admin> {
    return this.http.post<RegisterResponse>(
      this.apiUrl,
      { full_name, email, password },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.admin),
      catchError(error => {
        console.error('Admin registration error:', error);
        throw error;
      })
    );
  }

  // ✅ Admin Login (Enhanced with session management)
  login(email: string, password: string): Observable<boolean> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { email, password },
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success && response.admin) {
          // Store admin data in localStorage
          this.setCurrentAdmin(response.admin);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('Admin login error:', error);
        throw error;
      })
    );
  }

  // ✅ Set current admin (session management)
  setCurrentAdmin(admin: Admin): void {
    localStorage.setItem(this.ADMIN_KEY, JSON.stringify(admin));
    localStorage.setItem(this.ADMIN_EMAIL_KEY, admin.email);
    // Notify all subscribers about the login
    this.currentAdminSubject.next(admin);
  }

  // ✅ Get current logged-in admin
  getCurrentAdmin(): Admin | null {
    const data = localStorage.getItem(this.ADMIN_KEY);
    return data ? JSON.parse(data) : null;
  }

  // ✅ Get current admin email (quick access)
  getCurrentAdminEmail(): string | null {
    return localStorage.getItem(this.ADMIN_EMAIL_KEY);
  }

  // ✅ Clear current admin session
  clearCurrentAdmin(): void {
    localStorage.removeItem(this.ADMIN_KEY);
    localStorage.removeItem(this.ADMIN_EMAIL_KEY);
    // Notify all subscribers about the logout
    this.currentAdminSubject.next(null);
  }

  // ✅ Logout
  logout(): void {
    this.clearCurrentAdmin();
  }

  // ✅ Check login status
  isLoggedIn(): boolean {
    return this.getCurrentAdmin() !== null;
  }

  // ✅ Update current admin data in session (after profile update)
  updateCurrentAdminSession(updatedAdmin: Admin): void {
    const currentAdmin = this.getCurrentAdmin();
    if (currentAdmin && currentAdmin.id === updatedAdmin.id) {
      this.setCurrentAdmin(updatedAdmin);
    }
  }

  // ✅ Get all admins
  getAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Get admins error:', error);
        return of([]);
      })
    );
  }

  // ✅ Get admin by ID
  getAdminById(id: number): Observable<Admin | null> {
    return this.http.get<Admin>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Get admin by id error:', error);
        return of(null);
      })
    );
  }

  // ✅ Update admin
  updateAdmin(id: number, adminData: Partial<Admin>): Observable<Admin> {
    return this.http.put<Admin>(
      `${this.apiUrl}/${id}`,
      adminData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(updatedAdmin => {
        // If updating current admin, update session too
        this.updateCurrentAdminSession(updatedAdmin);
      }),
      catchError(error => {
        console.error('Update admin error:', error);
        throw error;
      })
    );
  }

  // ✅ Update admin profile
  updateAdminProfile(id: number, profileData: Partial<Admin>): Observable<Admin> {
    return this.http.put<Admin>(
      `${this.apiUrl}/${id}/profile`,
      profileData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(updatedAdmin => {
        this.updateCurrentAdminSession(updatedAdmin);
      }),
      catchError(error => {
        console.error('Update admin profile error:', error);
        throw error;
      })
    );
  }

  // ✅ Change password
  changePassword(id: number, password: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/password`,
      { password },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        throw error;
      })
    );
  }

  // ✅ Delete admin
  deleteAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // If deleting current admin, logout
        const currentAdmin = this.getCurrentAdmin();
        if (currentAdmin && currentAdmin.id === id) {
          this.logout();
        }
      }),
      catchError(error => {
        console.error('Delete admin error:', error);
        throw error;
      })
    );
  }

  // ✅ Check if admin session is valid (optional - for security)
  validateSession(): Observable<boolean> {
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) {
      return of(false);
    }

    // Optional: Verify session with backend
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/validate-session`).pipe(
      map(response => response.valid),
      catchError(() => {
        // If validation fails, clear session
        this.clearCurrentAdmin();
        return of(false);
      })
    );
  }
}