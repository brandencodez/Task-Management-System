import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../projects/project.service';
import { Project } from '../../shared/models/project.model';
import { EmployeeService } from '../employees/employee.service'; // Add this line
import { UserService } from '../../shared/services/user.service';

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
    private employeeService: EmployeeService
  ) {
    this.loadChatMessages();
    this.loadEmployeesFromService();
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
  chatMessages: any[] = [];
  employees: any[] = [];

  // Load real employees from your EmployeeService
  loadEmployeesFromService() {
    try {
      // Get all employees from your service
      const allEmployees = this.employeeService.getEmployees();
      
      // Filter out the current admin user (optional)
      // You might want to exclude the current logged-in admin
      this.employees = allEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        email: emp.email
      }));
      
      // If no employees found, add some defaults
      if (this.employees.length === 0) {
        this.employees = [
          { id: '1', name: 'Development Team', department: 'Development', position: 'Team' },
          { id: '2', name: 'Marketing Team', department: 'Marketing', position: 'Team' },
          { id: '3', name: 'HR Team', department: 'HR', position: 'Team' }
        ];
      }
      
      // Initialize chat messages for each employee if none exist
      this.initializeDefaultMessages();
      
    } catch (error) {
      console.error('Error loading employees:', error);
      this.employees = [
        { id: 'temp1', name: 'Employee 1', department: 'Development' },
        { id: 'temp2', name: 'Employee 2', department: 'Marketing' }
      ];
    }
  }

  // Initialize default welcome messages
  initializeDefaultMessages() {
    if (this.chatMessages.length === 0) {
      this.employees.forEach(emp => {
        const welcomeMsg = {
          id: Date.now() + emp.id,
          sender: 'employee',
          employeeId: emp.id,
          content: `Hello! I'm ${emp.name} from ${emp.department} department.`,
          timestamp: new Date(Date.now() - 86400000), // Yesterday
          read: false
        };
        this.chatMessages.push(welcomeMsg);
      });
      this.saveChatMessages();
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
    this.markMessagesAsRead(employee.id);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedEmployee) return;

    const message = {
      id: Date.now(),
      sender: 'admin',
      employeeId: this.selectedEmployee.id,
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: true
    };

    this.chatMessages.push(message);
    this.saveChatMessages();
    this.newMessage = '';
    
    // Optional: Simulate employee reply after 1-3 seconds
    setTimeout(() => {
      const responses = [
        "Got it, thanks!",
        "I'll work on that right away.",
        "Can you provide more details?",
        "Noted. Will update you soon.",
        "Thanks for the information!"
      ];
      
      const reply = {
        id: Date.now() + 1,
        sender: 'employee',
        employeeId: this.selectedEmployee.id,
        content: `${this.selectedEmployee.name}: ${responses[Math.floor(Math.random() * responses.length)]}`,
        timestamp: new Date(),
        read: false
      };
      
      this.chatMessages.push(reply);
      this.saveChatMessages();
    }, 1000 + Math.random() * 2000);
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

  getMessagesWithEmployee(employeeId: string) {
    return this.chatMessages
      .filter(msg => msg.employeeId === employeeId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getLastMessage(employeeId: string): string {
    const messages = this.getMessagesWithEmployee(employeeId);
    if (messages.length === 0) return 'No messages yet';
    
    const lastMsg = messages[messages.length - 1];
    // Extract just the message content without sender name
    const content = lastMsg.content;
    // If message contains colon (from formatted replies), take the part after colon
    const messageText = content.includes(': ') ? content.split(': ')[1] : content;
    
    return messageText.length > 25 
      ? messageText.substring(0, 25) + '...' 
      : messageText;
  }

  getLastMessageTime(employeeId: string): string {
    const messages = this.getMessagesWithEmployee(employeeId);
    if (messages.length === 0) return '';
    
    const lastMsg = messages[messages.length - 1];
    const now = new Date();
    const msgTime = new Date(lastMsg.timestamp);
    const diffMs = now.getTime() - msgTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return msgTime.toLocaleDateString();
  }

  getUnreadCount(employeeId: string): number {
    return this.chatMessages.filter(msg => 
      msg.employeeId === employeeId && 
      msg.sender === 'employee' && 
      !msg.read
    ).length;
  }

  get unreadCount(): number {
    return this.employees.reduce((total, emp) => 
      total + this.getUnreadCount(emp.id), 0
    );
  }

  markMessagesAsRead(employeeId: string) {
    this.chatMessages.forEach(msg => {
      if (msg.employeeId === employeeId && msg.sender === 'employee') {
        msg.read = true;
      }
    });
    this.saveChatMessages();
  }

  loadChatMessages() {
    const saved = localStorage.getItem('admin_chat_messages');
    this.chatMessages = saved ? JSON.parse(saved) : [];
  }

  saveChatMessages() {
    localStorage.setItem('admin_chat_messages', JSON.stringify(this.chatMessages));
  }

  // Optional: Clear all chat history
  clearChatHistory() {
    if (confirm('Clear all chat messages?')) {
      this.chatMessages = [];
      this.saveChatMessages();
    }
  }
}