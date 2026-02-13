import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../features/admins/admin.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Input() role: 'user' | 'admin' | null = null;
  isMenuOpen = false;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private userService: UserService,
    private elementRef: ElementRef
  ) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.isMenuOpen) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }

  handleLogout(): void {
    this.closeMenu();

    if (this.role === 'admin') {
      this.adminService.logout();
      this.router.navigate(['/authpage']);
      return;
    }

    if (this.role === 'user') {
      this.userService.logout();
      this.router.navigate(['/user-login']);
    }
  }
}
