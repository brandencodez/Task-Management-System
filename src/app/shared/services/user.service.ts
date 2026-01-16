import { Injectable } from '@angular/core';

interface UserCredentials {
  name: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private USER_KEY = 'current_user_name';
  private CREDENTIALS_KEY = 'employee_credentials';


  setCurrentUser(name: string): void {
    localStorage.setItem(this.USER_KEY, name);
  }

  getCurrentUser(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  setCredentials(name: string, password: string): void {
    const credentials: UserCredentials = { name, password };
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
    this.setCurrentUser(name); 
  }

  validateCredentials(name: string, password: string): boolean {
    const saved = localStorage.getItem(this.CREDENTIALS_KEY);
    if (!saved) return false;

    try {
      const creds: UserCredentials = JSON.parse(saved);
      return creds.name.toLowerCase() === name.toLowerCase() && 
             creds.password === password;
    } catch {
      return false;
    }
  }

  hasPassword(name: string): boolean {
    const saved = localStorage.getItem(this.CREDENTIALS_KEY);
    if (!saved) return false;

    try {
      const creds: UserCredentials = JSON.parse(saved);
      return creds.name.toLowerCase() === name.toLowerCase();
    } catch {
      return false;
    }
  }

  clearCurrentUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }
}