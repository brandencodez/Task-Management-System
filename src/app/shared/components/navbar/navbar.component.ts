import { Component, ChangeDetectorRef, ElementRef, HostListener, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../features/admins/admin.service';
import { UserService } from '../../services/user.service';
import { ReminderService } from '../../../features/reminders/reminder.service';
import { MeetingNotification } from '../../models/reminder.model';
import { Subscription, interval, merge } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() role: 'user' | 'admin' | null = null;
  isMenuOpen = false;
  notifications: MeetingNotification[] = [];
  showNotifDropdown = false;
  private pollSub?: Subscription;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private userService: UserService,
    private reminderService: ReminderService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.role === 'user' || this.role === 'admin') {
      this.loadNotifications();

      // Merge: 30s poll + route navigation + explicit refresh from service
      const poll$ = interval(30000);
      const nav$ = this.router.events.pipe(filter(e => e instanceof NavigationEnd));
      const refresh$ = this.reminderService.notificationRefresh$;

      this.pollSub = merge(poll$, nav$, refresh$).subscribe(() => this.loadNotifications());
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private loadNotifications(): void {
    if (this.role === 'admin') {
      this.reminderService.getAllNotifications().subscribe({
        next: (notifs) => { this.notifications = notifs; this.cdr.detectChanges(); }
      });
    } else if (this.role === 'user') {
      const userId = this.userService.getCurrentUserId();
      if (!userId) return;
      this.reminderService.getNotifications(+userId).subscribe({
        next: (notifs) => { this.notifications = notifs; this.cdr.detectChanges(); }
      });
    }
  }

  toggleNotifDropdown(event: Event): void {
    event.stopPropagation();
    this.showNotifDropdown = !this.showNotifDropdown;
  }

  goToMeetings(event: Event): void {
    event.stopPropagation();
    this.showNotifDropdown = false;
    this.closeMenu();
    if (this.role === 'admin') {
      this.router.navigate(['/admin-dashboard/reminders']);
    } else {
      this.router.navigate(['/user-dashboard/my-meetings']);
    }
  }

  dismissNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.reminderService.dismissNotification(id).subscribe({
      next: () => { this.notifications = this.notifications.filter(n => n.id !== id); this.cdr.detectChanges(); }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  handleOutsideClick(event: Event): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      if (this.isMenuOpen) this.closeMenu();
      if (this.showNotifDropdown) this.showNotifDropdown = false;
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
