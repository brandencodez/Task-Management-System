import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; 
import { ProjectService } from '../../projects/project.service';
import { UserService } from '../../../shared/services/user.service';
import { EmployeeService } from '../../employees/employee.service';
import { Project } from '../../../shared/models/project.model';
import { Router } from '@angular/router';
import { ChatService } from '../../../shared/services/chat.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], 
  templateUrl: './user-projects.component.html',
  styleUrls: ['./user-projects.component.css']
})
export class UserProjectsComponent implements OnInit {
  projects: Project[] = [];
  currentUser: string | null = null;
  userDepartment: string | null = null;
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
    role: 'admin' as 'admin'
  };

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private employeeService: EmployeeService,
    private router: Router,
    private chatService: ChatService
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

  loadAllData() {
    this.isLoading = true;
    
    // Load employees and projects in parallel
    forkJoin({
      employees: this.employeeService.getEmployees(),
      projects: this.projectService.getProjects()
    }).subscribe({
      next: ({ employees, projects }) => {
        // Find current employee
        const employee = employees.find(emp => emp.name === this.currentUser);
        
        if (employee) {
          this.userDepartment = employee.department;
          
          // Filter projects by department
          this.projects = projects.filter(project => 
            project.department === this.userDepartment
          );
          
          // Initialize chat user
          this.chatCurrentUser = {
            id: employee.id.toString(),
            name: employee.name,
            department: employee.department,
            role: 'employee' as 'employee'
          };
          
          this.chatService.setCurrentUser(
            employee.id.toString(),
            employee.name,
            'employee'
          );
          
          // Load other employees for chat
          this.otherEmployees = employees
            .filter(emp => emp.name !== this.currentUser)
            .map(emp => ({
              id: emp.id.toString(),
              name: emp.name,
              department: emp.department,
              role: 'employee' as 'employee'
            }));
          
          console.log('✅ Data loaded:', {
            department: this.userDepartment,
            projectCount: this.projects.length,
            employeeCount: this.otherEmployees.length
          });
        } else {
          console.warn('Current user not found in employees');
          this.projects = [];
        }
        
        this.isLoading = false;
        
        // Auto-select admin for chat if no participant selected
        if (!this.selectedParticipant) {
          this.selectParticipant(this.adminParticipant);
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.projects = [];
        this.otherEmployees = [];
        this.isLoading = false;
      }
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
    return this.otherEmployees.filter(emp =>
      emp.name.toLowerCase().includes(term) ||
      (emp.department && emp.department.toLowerCase().includes(term))
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
      this.selectedParticipant.id
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
      receiverRole: this.selectedParticipant.id === 'admin' ? 'admin' as 'admin' | 'employee' : 'employee' as 'admin' | 'employee',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: false
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
}