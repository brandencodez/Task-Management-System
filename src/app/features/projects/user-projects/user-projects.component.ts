import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProjectService } from '../../projects/project.service';
import { UserService } from '../../../shared/services/user.service';
import { EmployeeService } from '../../employees/employee.service';
import { ProjectAssignmentService } from '../../../shared/services/project-assignment.service'; // ✅ Add this import
import { Project } from '../../../shared/models/project.model';
import { Router } from '@angular/router';
import { ChatService } from '../../../shared/services/chat.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-projects.component.html',
  styleUrls: ['./user-projects.component.css'],
})
export class UserProjectsComponent implements OnInit {
  projects: Project[] = [];
  currentUser: string | null = null;
  userDepartment_id!: number; // logic
  userDepartment_name: string = ''; // display
  isLoading = true; // Add loading state

  // ====================
  // CHAT SYSTEM PROPERTIES
  // ====================
  showChatPanel = false;
  selectedParticipant: any = null;
  newMessage = '';
  employeeSearch = '';
  otherEmployees: any[] = [];
  chatCurrentUser: any = null;

  adminParticipant = {
    id: 'admin',
    name: 'Admin',
    role: 'admin' as 'admin',
  };

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private employeeService: EmployeeService,
    private projectAssignmentService: ProjectAssignmentService, // ✅ Add this dependency
    private router: Router,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/user-login']);
      return;
    }

    // Load all data in parallel using forkJoin for better reliability
    this.loadAllData();
  }

  loadUserInfo(user: any) {
    this.userDepartment_id = user.department_id;
    this.userDepartment_name = user.department_name;
  }

  loadAllData() {
    this.isLoading = true;

    // ✅ STEP 1: Load employees first to get the current employee ID
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        // Find current employee
        const employee = employees.find((emp) => emp.name === this.currentUser);

        if (!employee) {
          console.warn('Current user not found in employees');
          this.projects = [];
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        // Store employee info
        this.userDepartment_id = employee.department_id;

        // Initialize chat user
        this.chatCurrentUser = {
          id: employee.id.toString(),
          name: employee.name,
          department: employee.department_id.toString(),
          role: 'employee' as 'employee',
        };

        this.chatService.setCurrentUser(employee.id.toString(), employee.name, 'employee');

        // Load other employees for chat
        this.otherEmployees = employees
          .filter((emp) => emp.name !== this.currentUser)
          .map((emp) => ({
            id: emp.id.toString(),
            name: emp.name,
            department: emp.department_id.toString(),
            role: 'employee' as 'employee',
          }));

        // ✅ STEP 2: Load assignments and projects for this specific employee
        forkJoin({
          assignments: this.projectAssignmentService.getAssignmentsByEmployee(employee.id),
          projects: this.projectService.getProjects(),
        }).subscribe({
          next: ({ assignments, projects }) => {
            // Extract project IDs from assignments
            const assignedProjectIds = assignments.map((assignment) => assignment.project_id);

            // ✅ Filter projects to only those assigned to this employee
            this.projects = projects.filter((project) =>
              assignedProjectIds.includes(project.id)
            );

            console.log('✅ Data loaded:', {
              employeeId: employee.id,
              department: this.userDepartment_id,
              assignedProjects: assignedProjectIds,
              projectCount: this.projects.length,
              employeeCount: this.otherEmployees.length,
            });

            this.isLoading = false;
            this.cdr.detectChanges(); // ✅ Force UI update

            // Auto-select admin for chat if no participant selected
            if (!this.selectedParticipant) {
              this.selectParticipant(this.adminParticipant);
            }
          },
          error: (error) => {
            console.error('Error loading assignments/projects:', error);
            this.projects = [];
            this.isLoading = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.projects = [];
        this.otherEmployees = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  logout() {
    this.userService.clearCurrentUser();
    this.router.navigate(['/user-login']);
  }

  // ====================
  // CHAT METHODS
  // ====================

  get filteredEmployees() {
    if (!this.employeeSearch) return this.otherEmployees;
    const term = this.employeeSearch.toLowerCase().trim();
    return this.otherEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        (emp.department && emp.department.toLowerCase().includes(term)),
    );
  }

  toggleChatPanel() {
    this.showChatPanel = !this.showChatPanel;
  }

  selectParticipant(participant: any) {
    this.selectedParticipant = participant;
    if (this.chatCurrentUser) {
      this.chatService.markMessagesAsRead(this.chatCurrentUser.id, participant.id);
    }
  }

  getMessagesWithParticipant() {
    if (!this.selectedParticipant || !this.chatCurrentUser) return [];
    return this.chatService.getMessagesBetween(
      this.chatCurrentUser.id,
      this.selectedParticipant.id,
    );
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedParticipant || !this.chatCurrentUser) return;

    const message = {
      id: Date.now().toString(),
      senderId: this.chatCurrentUser.id,
      senderName: this.chatCurrentUser.name,
      senderRole: 'employee' as 'admin' | 'employee',
      receiverId: this.selectedParticipant.id,
      receiverName: this.selectedParticipant.name,
      receiverRole:
        this.selectedParticipant.id === 'admin'
          ? ('admin' as 'admin' | 'employee')
          : ('employee' as 'admin' | 'employee'),
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: false,
    };

    this.chatService.sendMessage(message);
    this.newMessage = '';
  }

  getLastMessage(participantId: string): string {
    if (!this.chatCurrentUser) return 'No messages yet';
    return this.chatService.getLastMessage(this.chatCurrentUser.id, participantId);
  }

  getLastMessageTime(participantId: string): string {
    if (!this.chatCurrentUser) return '';

    const lastTime = this.chatService.getLastMessageTime(this.chatCurrentUser.id, participantId);
    if (lastTime.getTime() === 0) return '';

    const now = new Date();
    const diffMs = now.getTime() - lastTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  }

  getUnreadCount(participantId: string): number {
    if (!this.chatCurrentUser) return 0;
    return this.chatService.getUnreadCountFrom(this.chatCurrentUser.id, participantId);
  }

  get unreadCount(): number {
    if (!this.chatCurrentUser) return 0;
    return this.chatService.getUnreadCount(this.chatCurrentUser.id);
  }

  // DATE FORMATTING METHOD
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }
}