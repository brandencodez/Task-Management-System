import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface LoginResponse {
  success: boolean;
  employee: any;
}

interface SetPasswordResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api';
  private USER_KEY = 'current_user_name';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Login via API
  login(name: string, password: string): Observable<boolean> {
    const credentials = { name, password };
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/login`,
      credentials,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          this.setCurrentUser(name);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of(false);
      })
    );
  }

  // Set password via API
  setPassword(name: string, password: string): Observable<boolean> {
    const credentials = { name, password };
    return this.http.post<SetPasswordResponse>(
      `${this.apiUrl}/auth/set-password`,
      credentials,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Set password error:', error);
        return of(false);
      })
    );
  }

  // Local storage methods (for session management only)
  setCurrentUser(name: string): void {
    localStorage.setItem(this.USER_KEY, name);
  }

  getCurrentUser(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  clearCurrentUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Check if user is logged in (session only)
  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }
  logout(): void {
  this.clearCurrentUser();
}
}

