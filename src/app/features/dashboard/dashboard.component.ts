import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../projects/project.service';
import { Project } from '../../shared/models/project.model';
import { EmployeeService } from '../employees/employee.service';
import { ChatService } from '../../shared/services/chat.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  searchTerm = '';

  allProjects: Project[] = [];
  upcoming: Project[] = [];
  ongoing: Project[] = [];
  completed: Project[] = [];
  warning: Project[] = [];
  overdue: Project[] = [];

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private chatService: ChatService
  ) {
    this.loadEmployeesFromService();
    this.initializeChat();
  }

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.allProjects = this.projectService.getProjects();
    this.categorizeProjects();
  }

  categorizeProjects() {
    const today = new Date();

    // Reset arrays
    this.upcoming = [];
    this.ongoing = [];
    this.completed = [];
    this.warning = [];
    this.overdue = [];

    this.allProjects.forEach(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.finishDate);
      const diffDays = Math.ceil(
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // First, check the status field
      if (p.status === 'COMPLETED') {
        this.completed.push(p);
        return;
      }

      // Check if overdue
      if (today > end) {
        this.overdue.push(p);
        this.ongoing.push(p); // Add to ongoing as well
        return;
      }

      // Check if deadline is within 3 days (warning)
      if (diffDays <= 3 && diffDays > 0) {
        this.warning.push(p);
        this.ongoing.push(p);
        return;
      }

      // Check if ongoing (started but not finished)
      if (today >= start && today <= end) {
        this.ongoing.push(p);
        return;
      }

      // Check if upcoming
      if (today < start) {
        this.upcoming.push(p);
        return;
      }
    });
  }

  get totalTasks() {
    return this.allProjects.length;
  }

  filtered(list: Project[]) {
    if (!this.searchTerm) return list;

    const term = this.searchTerm.toLowerCase().trim();
    
    return list.filter(p =>
      p.department?.toLowerCase().includes(term)
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
  currentUser = { id: 'admin', name: 'Admin', role: 'admin' as 'admin' | 'employee' };

  // Load real employees from your EmployeeService
  loadEmployeesFromService() {
    try {
      // Get all employees from your service
      const allEmployees = this.employeeService.getEmployees();
      
      this.employees = allEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        email: emp.email,
        role: 'employee' as 'admin' | 'employee'
      }));
      
      // If no employees found, add some defaults
      if (this.employees.length === 0) {
        this.employees = [
          { id: '1', name: 'Development Team', department: 'Development', position: 'Team', role: 'employee' as 'admin' | 'employee' },
          { id: '2', name: 'Marketing Team', department: 'Marketing', position: 'Team', role: 'employee' as 'admin' | 'employee' },
          { id: '3', name: 'HR Team', department: 'HR', position: 'Team', role: 'employee' as 'admin' | 'employee' }
        ];
      }
      
    } catch (error) {
      console.error('Error loading employees:', error);
      this.employees = [
        { id: 'temp1', name: 'Employee 1', department: 'Development', role: 'employee' as 'admin' | 'employee' },
        { id: 'temp2', name: 'Employee 2', department: 'Marketing', role: 'employee' as 'admin' | 'employee' }
      ];
    }
  }

  // Initialize chat
  initializeChat() {
    // Set admin as current user
    this.chatService.setCurrentUser('admin', 'Admin', 'admin');
    
    // Check if we need to create welcome messages
    const messages = this.chatService.getAllMessages();
    if (messages.length === 0 && this.employees.length > 0) {
      // Create welcome messages from employees to admin
      setTimeout(() => {
        this.employees.forEach(emp => {
          const welcomeMsg = {
            id: Date.now().toString() + emp.id,
            senderId: emp.id,
            senderName: emp.name,
            senderRole: 'employee' as 'admin' | 'employee',
            receiverId: 'admin',
            receiverName: 'Admin',
            receiverRole: 'admin' as 'admin' | 'employee',
            content: `Hello Admin! I'm ${emp.name} from ${emp.department} department, ready to work.`,
            timestamp: new Date(),
            read: false
          };
          this.chatService.sendMessage(welcomeMsg);
        });
      }, 1000);
    }
  }

  toggleChatPanel() {
    this.showChatPanel = !this.showChatPanel;
    if (this.showChatPanel && this.employees.length > 0 && !this.selectedEmployee) {
      this.selectEmployee(this.employees[0]);
    }
  }

  selectEmployee(employee: any) {
    this.selectedEmployee = employee;
    this.chatService.markMessagesAsRead('admin', employee.id);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedEmployee) return;

    const message = {
      id: Date.now().toString(),
      senderId: 'admin',
      senderName: 'Admin',
      senderRole: 'admin' as 'admin' | 'employee',
      receiverId: this.selectedEmployee.id,
      receiverName: this.selectedEmployee.name,
      receiverRole: 'employee' as 'admin' | 'employee',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: false
    };

    this.chatService.sendMessage(message);
    this.newMessage = '';
  }

  get filteredEmployees() {
    if (!this.employeeSearch) return this.employees;
    const term = this.employeeSearch.toLowerCase().trim();
    return this.employees.filter(emp =>
      emp.name.toLowerCase().includes(term) ||
      (emp.department && emp.department.toLowerCase().includes(term))
    );
  }

  getMessagesWithEmployee() {
    if (!this.selectedEmployee) return [];
    return this.chatService.getMessagesBetween('admin', this.selectedEmployee.id);
  }

  getLastMessage(employeeId: string): string {
    return this.chatService.getLastMessage('admin', employeeId);
  }

  getLastMessageTime(employeeId: string): string {
    const lastTime = this.chatService.getLastMessageTime('admin', employeeId);
    if (lastTime.getTime() === 0) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return lastTime.toLocaleDateString();
  }

  getUnreadCount(employeeId: string): number {
    return this.chatService.getUnreadCountFrom('admin', employeeId);
  }

  get unreadCount(): number {
    return this.chatService.getUnreadCount('admin');
  }

  // ====================
  // MOM (Memo of Moment) SYSTEM
  // ====================
  selectedProjectForMom: any = null;
  newMomText: string = '';
  editingMom: any = null;

  // Open MoM popup for a project
  openMomPopup(project: any) {
    this.selectedProjectForMom = project;
    this.newMomText = '';
    this.editingMom = null;
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

  // Get all MoMs for a project
  getProjectMoms(projectId: number): any[] {
    const saved = localStorage.getItem(`project_moms_${projectId}`);
    return saved ? JSON.parse(saved) : [];
  }

  // Save MoMs for a project
  saveProjectMoms(projectId: number, moms: any[]) {
    localStorage.setItem(`project_moms_${projectId}`, JSON.stringify(moms));
  }

  // Add new MoM
  addNewMom() {
    if (!this.newMomText.trim() || !this.selectedProjectForMom) return;

    const moms = this.getProjectMoms(this.selectedProjectForMom.id);
    
    if (this.editingMom) {
      // Update existing MoM
      const index = moms.findIndex((m: any) => m.id === this.editingMom.id);
      if (index !== -1) {
        moms[index] = {
          ...moms[index],
          content: this.newMomText.trim(),
          updatedAt: new Date()
        };
      }
    } else {
      // Add new MoM
      const newMom = {
        id: Date.now(),
        content: this.newMomText.trim(),
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      moms.push(newMom);
    }

    this.saveProjectMoms(this.selectedProjectForMom.id, moms);
    this.newMomText = '';
    this.editingMom = null;
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
      const moms = this.getProjectMoms(this.selectedProjectForMom.id);
      const filteredMoms = moms.filter((m: any) => m.id !== momId);
      this.saveProjectMoms(this.selectedProjectForMom.id, filteredMoms);
      
      // If we were editing this mom, clear the form
      if (this.editingMom && this.editingMom.id === momId) {
        this.cancelEditMom();
      }
    }
  }
}