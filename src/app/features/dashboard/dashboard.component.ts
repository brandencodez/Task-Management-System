import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService } from '../projects/project.service';
import { Project } from '../../shared/models/project.model';
import { EmployeeService } from '../employees/employee.service';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { ProjectMemoService } from './project-memo.service';
import { ProjectStatusChartComponent } from './charts/project-status-chart.component';
import { ProjectsByDepartmentComponent } from './charts/projects-by-department.component';
import { ProjectsCompletedPerMonthComponent } from './charts/projects-completed-per-month.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HttpClientModule,
    ProjectStatusChartComponent,
    ProjectsByDepartmentComponent,
    ProjectsCompletedPerMonthComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;

  searchTerm = '';

  allProjects: Project[] = [];
  upcoming: Project[] = [];
  ongoing: Project[] = [];
  completed: Project[] = [];
  warning: Project[] = [];
  overdue: Project[] = [];

  // ====================
  // D3 CHARTS DATA
  // ====================
  projectStatusData = { onTrack: 0, completed: 0, warning: 0, overdue: 0 };
  departmentData: { department: string; count: number }[] = [];
  monthlyData: { month: string; count: number }[] = [];

  // ====================
  // MOM (Memo of Moment) SYSTEM
  // ====================
  selectedProjectForMom: any = null;
  newMomText: string = '';
  editingMom: any = null;
  projectMoms: Map<number, any[]> = new Map(); // Cache memos by project ID
  loadingMoms = false;

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private projectMemoService: ProjectMemoService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProjects();
    this.loadEmployeesFromService();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects() {
    this.isLoading = true;
    this.projectService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects) => {
          this.allProjects = projects;
          this.categorizeProjects();
          this.isLoading = false;
          console.log('✅ Dashboard: Projects loaded:', this.allProjects.length, 'projects');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load projects in dashboard:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  categorizeProjects() {
    const today = new Date();

    // Reset arrays
    this.upcoming = [];
    this.ongoing = [];
    this.completed = [];
    this.warning = [];
    this.overdue = [];

    // Reset chart data
    this.projectStatusData = { onTrack: 0, completed: 0, warning: 0, overdue: 0 };
    this.departmentData = [];
    this.monthlyData = [];

    this.allProjects.forEach(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.finishDate);
      const diffDays = Math.ceil(
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // First, check the status field
      if (p.status === 'COMPLETED') {
        this.completed.push(p);
        this.projectStatusData.completed++;
        return;
      }

      // Check if overdue
      if (today > end) {
        this.overdue.push(p);
        this.ongoing.push(p); // Add to ongoing as well
        this.projectStatusData.overdue++;
        return;
      }

      // Check if deadline is within 3 days (warning)
      if (diffDays <= 3 && diffDays > 0) {
        this.warning.push(p);
        this.ongoing.push(p);
        this.projectStatusData.warning++;
        return;
      }

      // Check if ongoing (started but not finished)
      if (today >= start && today <= end) {
        this.ongoing.push(p);
        this.projectStatusData.onTrack++;
        return;
      }

      // Check if upcoming
      if (today < start) {
        this.upcoming.push(p);
        return;
      }
    });

    // Count by department
    const departmentCounts: Record<string, number> = {};
    this.allProjects.forEach(p => {
      const dept = p.department_name || p.department_id || 'Other';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    this.departmentData = Object.entries(departmentCounts).map(([dept, count]) => ({
      department: dept,
      count
    }));

    // Monthly completion data (for last 3 months)
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get last 3 months
    const currentMonth = now.getMonth();
    const last3Months = [
      months[(currentMonth - 2 + 12) % 12],
      months[(currentMonth - 1 + 12) % 12],
      months[currentMonth]
    ];

    this.monthlyData = last3Months.map(month => {
      const count = this.allProjects.filter(p => 
        p.status === 'COMPLETED' && 
        p.finishDate && 
        new Date(p.finishDate).getMonth() === months.indexOf(month) &&
        new Date(p.finishDate).getFullYear() === now.getFullYear()
      ).length;
      return { month, count };
    });
  }

  get totalTasks() {
    return this.allProjects.length;
  }

  // Computed properties for chart data binding
  get formattedDepartmentData() {
    return this.departmentData.map(d => ({ 
      name: d.department, 
      count: d.count 
    }));
  }

  get formattedMonthlyData() {
    return this.monthlyData.map(m => ({ 
      month: m.month, 
      count: m.count 
    }));
  }

  filtered(list: Project[]) {
    if (!this.searchTerm) return list;

    const term = this.searchTerm.toLowerCase().trim();
    
   return list.filter(p =>
  p.department_name?.toLowerCase().includes(term)
);

  }

  // Helper to check if a project is overdue
  isOverdue(project: Project): boolean {
    return this.overdue.some(p => p.id === project.id);
  }

  // Helper to check if a project is in warning
  isWarning(project: Project): boolean {
    return this.warning.some(p => p.id === project.id);
  }

  // Helper to get days overdue
  getDaysOverdue(project: Project): number {
    const today = new Date();
    const end = new Date(project.finishDate);
    const diffTime = today.getTime() - end.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Helper to get days until deadline
  getDaysUntilDeadline(project: Project): number {
    const today = new Date();
    const end = new Date(project.finishDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ====================
  // CHAT SYSTEM
  // ====================
  employeeSearch = '';
  newMessage = '';
  showChatPanel = false;
  selectedEmployee: any = null;
  employees: any[] = [];

  // Load real employees from your EmployeeService
  loadEmployeesFromService() {
    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.employees = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            department_id: emp.department_id,
            position: emp.position,
            email: emp.email
          }));
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load employees:', err);
          this.cdr.detectChanges();
        }
      });
  }

  toggleChatPanel() {
    this.showChatPanel = !this.showChatPanel;
    if (this.showChatPanel && this.employees.length > 0 && !this.selectedEmployee) {
      this.selectEmployee(this.employees[0]);
    }
  }

  selectEmployee(employee: any) {
    this.selectedEmployee = employee;
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedEmployee) return;
    // localStorage chat simulation:
    this.newMessage = '';
  }

  get filteredEmployees() {
    if (!this.employeeSearch) return this.employees;
    const term = this.employeeSearch.toLowerCase().trim();
    return this.employees.filter(emp =>
      emp.name.toLowerCase().includes(term) ||
      (emp.department && emp.department.toLowerCase().includes(term)) ||
      (emp.position && emp.position.toLowerCase().includes(term))
    );
  }

  getMessagesWithEmployee(employeeId?: string) {
  if (!employeeId || !this.selectedEmployee) return [];
  
  // localStorage chat simulation:
  const messages = JSON.parse(localStorage.getItem('admin_chat_messages') || '[]');
  return messages.filter((msg: any) => msg.employeeId === employeeId)
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

  getLastMessage(employeeId: string): string {
    return 'No messages yet';
  }

  getLastMessageTime(employeeId: string): string {
    return '';
  }

  getUnreadCount(employeeId: string): number {
    return 0;
  }

  get unreadCount(): number {
    return 0;
  }

  // Open MoM popup for a project
  openMomPopup(project: any) {
    this.selectedProjectForMom = project;
    this.newMomText = '';
    this.editingMom = null;
    
    // Load memos from database
    this.loadProjectMoms(project.id);
  }

  // Close MoM popup
  closeMomPopup() {
    this.selectedProjectForMom = null;
    this.newMomText = '';
    this.editingMom = null;
  }

  // Get project status class for badge
  getProjectStatusClass(project: any): string {
    if (this.isOverdue(project)) return 'overdue';
    if (this.isWarning(project)) return 'ongoing';
    if (project.status === 'COMPLETED') return 'completed';
    if (this.upcoming.some(p => p.id === project.id)) return 'upcoming';
    return 'ongoing';
  }

  // Get project status text
  getProjectStatusText(project: any): string {
    if (this.isOverdue(project)) return 'OVERDUE';
    if (this.isWarning(project)) return 'WARNING';
    if (project.status === 'COMPLETED') return 'COMPLETED';
    if (this.upcoming.some(p => p.id === project.id)) return 'UPCOMING';
    return 'ONGOING';
  }

  // Helper to extract client name from clientDetails
  getClientName(clientDetails: any): string {
    if (!clientDetails) return 'Not specified';
    
    // If it's a string, return as is
    if (typeof clientDetails === 'string') {
      return clientDetails.length > 30 ? clientDetails.substring(0, 30) + '...' : clientDetails;
    }
    
    // If it's an object with your structure
    if (typeof clientDetails === 'object') {
      // First priority: companyName
      if (clientDetails.companyName) return clientDetails.companyName;
      
      // Second priority: name property
      if (clientDetails.name) return clientDetails.name;
      
      // Third priority: first contact's name
      if (clientDetails.contacts && clientDetails.contacts.length > 0) {
        const firstContact = clientDetails.contacts[0];
        if (firstContact.name) return firstContact.name;
        if (firstContact.email) {
          // Extract name from email
          const emailPart = firstContact.email.split('@')[0];
          return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
        }
      }
      
      // Fourth priority: clientDetails itself (as fallback)
      return JSON.stringify(clientDetails).substring(0, 30) + '...';
    }
    
    return 'Not specified';
  }

  // Get all MoMs for a project from service
  loadProjectMoms(projectId: number) {
    this.loadingMoms = true;
    this.projectMemoService.getMemosByProject(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (memos) => {
          this.projectMoms.set(projectId, memos);
          this.loadingMoms = false;
          console.log('✅ Memos loaded for project', projectId, ':', memos.length, 'memos');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load memos:', err);
          this.loadingMoms = false;
          this.projectMoms.set(projectId, []);
          this.cdr.detectChanges();
        }
      });
  }

  // Get cached MoMs for a project
  getProjectMoms(projectId: number): any[] {
    return this.projectMoms.get(projectId) || [];
  }

  // Add new MoM
  addNewMom() {
    if (!this.newMomText.trim() || !this.selectedProjectForMom) return;

    if (this.editingMom) {
      // Update existing MoM
      this.projectMemoService.updateMemo(this.editingMom.id, {
        projectId: this.selectedProjectForMom.id,
        content: this.newMomText.trim()
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Memo updated successfully');
            this.newMomText = '';
            this.editingMom = null;
            this.loadProjectMoms(this.selectedProjectForMom.id);
          },
          error: (err) => {
            console.error('Failed to update memo:', err);
            alert('Failed to update memo. Please try again.');
          }
        });
    } else {
      // Add new MoM
      this.projectMemoService.createMemo({
        projectId: this.selectedProjectForMom.id,
        content: this.newMomText.trim()
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Memo created successfully');
            this.newMomText = '';
            this.editingMom = null;
            this.loadProjectMoms(this.selectedProjectForMom.id);
          },
          error: (err) => {
            console.error('Failed to create memo:', err);
            alert('Failed to create memo. Please try again.');
          }
        });
    }
  }

  // Start editing a MoM
  startEditMom(mom: any) {
    this.newMomText = mom.content;
    this.editingMom = mom;
  }

  // Cancel editing
  cancelEditMom() {
    this.newMomText = '';
    this.editingMom = null;
  }

  // Delete a MoM
  deleteMom(momId: number) {
    if (!this.selectedProjectForMom) return;
    
    if (confirm('Are you sure you want to delete this memo?')) {
      this.projectMemoService.deleteMemo(momId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Memo deleted successfully');
            
            // If we were editing this memo, clear the form
            if (this.editingMom && this.editingMom.id === momId) {
              this.cancelEditMom();
            }
            
            // Reload memos
            this.loadProjectMoms(this.selectedProjectForMom.id);
          },
          error: (err) => {
            console.error('Failed to delete memo:', err);
            alert('Failed to delete memo. Please try again.');
          }
        });
    }
  }
    logout(): void {
      this.userService.logout();
      this.router.navigate(['/authpage']);
    }

}