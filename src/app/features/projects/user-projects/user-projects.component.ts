import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProjectService } from '../../projects/project.service';
import { UserService } from '../../../shared/services/user.service';
import { EmployeeService } from '../../employees/employee.service';
import { ProjectAssignmentService } from '../../../shared/services/project-assignment.service';
import { Project } from '../../../shared/models/project.model';
import { Router } from '@angular/router';
import { ChatService } from '../../../shared/services/chat.service';
import { ProjectMemoService, ProjectMemo } from '../../../shared/services/project-memo.service';
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
  userDepartment_id!: number;
  userDepartment_name: string = '';
  isLoading = true;

  // ⭐ MODAL STATE
  selectedProject: Project | null = null;

  // 📝 MEMO STATE
  showMemoView = false;
  projectMemos: ProjectMemo[] = [];
  isLoadingMemos = false;
  memoError: string | null = null;
  newMemoContent = '';
  isSavingMemo = false;
  editingMemo: ProjectMemo | null = null;
  editMemoContent = '';

  // CHAT
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
    private projectAssignmentService: ProjectAssignmentService,
    private router: Router,
    private chatService: ChatService,
    private projectMemoService: ProjectMemoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/user-login']);
      return;
    }
    this.loadAllData();
  }

  openProjectModal(project: Project) {
    this.selectedProject = project;
    this.showMemoView = false;
    this.projectMemos = [];
    this.memoError = null;
    this.newMemoContent = '';
    this.editingMemo = null;
  }

  closeProjectModal() {
    this.selectedProject = null;
    this.showMemoView = false;
    this.projectMemos = [];
    this.editingMemo = null;
  }

  // 📝 Toggle between project details and memo view
  toggleMemoView() {
    this.showMemoView = !this.showMemoView;
    if (this.showMemoView && this.selectedProject) {
      this.loadMemos(this.selectedProject.id);
    }
  }

  loadMemos(projectId: number) {
    this.isLoadingMemos = true;
    this.memoError = null;

    this.projectMemoService.getMemosByProject(projectId).subscribe({
      next: (memos) => {
        this.projectMemos = memos;
        this.isLoadingMemos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.memoError = 'Failed to load memos.';
        this.isLoadingMemos = false;
        this.cdr.detectChanges();
      },
    });
  }

  addMemo() {
    if (!this.newMemoContent.trim() || !this.selectedProject) return;
    this.isSavingMemo = true;

    const memo: ProjectMemo = {
      projectId: this.selectedProject.id,
      content: this.newMemoContent.trim(),
    };

    this.projectMemoService.createMemo(memo).subscribe({
      next: (created) => {
        this.projectMemos.push(created);
        this.newMemoContent = '';
        this.isSavingMemo = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingMemo = false;
        this.cdr.detectChanges();
      },
    });
  }

  startEditMemo(memo: ProjectMemo) {
    this.editingMemo = memo;
    this.editMemoContent = memo.content;
  }

  cancelEditMemo() {
    this.editingMemo = null;
    this.editMemoContent = '';
  }

  saveEditMemo() {
    if (!this.editingMemo?.id || !this.editMemoContent.trim()) return;

    const updated: ProjectMemo = {
      ...this.editingMemo,
      content: this.editMemoContent.trim(),
    };

    this.projectMemoService.updateMemo(this.editingMemo.id, updated).subscribe({
      next: (saved) => {
        const idx = this.projectMemos.findIndex(m => m.id === saved.id);
        if (idx !== -1) this.projectMemos[idx] = saved;
        this.editingMemo = null;
        this.editMemoContent = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  deleteMemo(memo: ProjectMemo) {
    if (!memo.id) return;

    this.projectMemoService.deleteMemo(memo.id).subscribe({
      next: () => {
        this.projectMemos = this.projectMemos.filter(m => m.id !== memo.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  loadAllData() {
    this.isLoading = true;

    this.employeeService.getEmployees().subscribe({
      next: (employees) => {

        const employee = employees.find((emp) => emp.name.trim().toLowerCase() === this.currentUser?.trim().toLowerCase());

        if (!employee) {
          this.projects = [];
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.userDepartment_id = employee.department_id;

        this.chatCurrentUser = {
          id: employee.id.toString(),
          name: employee.name,
          department: employee.department_id.toString(),
          role: 'employee' as 'employee',
        };

        this.chatService.setCurrentUser(employee.id.toString(), employee.name, 'employee');

        this.otherEmployees = employees
          .filter((emp) => emp.name !== this.currentUser)
          .map((emp) => ({
            id: emp.id.toString(),
            name: emp.name,
            department: emp.department_id.toString(),
            role: 'employee' as 'employee',
          }));

        forkJoin({
          assignments: this.projectAssignmentService.getAssignmentsByEmployee(employee.id),
          projects: this.projectService.getProjects(),
        }).subscribe({
          next: ({ assignments, projects }) => {

            const assignedProjectIds = assignments.map((a) => a.project_id);

            this.projects = projects.filter((project) =>
              assignedProjectIds.includes(project.id)
            );

            this.isLoading = false;
            this.cdr.detectChanges();

            if (!this.selectedParticipant) {
              this.selectParticipant(this.adminParticipant);
            }
          },
          error: () => {
            this.projects = [];
            this.isLoading = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
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

  get filteredEmployees() {
    if (!this.employeeSearch) return this.otherEmployees;
    const term = this.employeeSearch.toLowerCase().trim();
    return this.otherEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        (emp.department && emp.department.toLowerCase().includes(term)),
    );
  }

  toggleChatPanel() { this.showChatPanel = !this.showChatPanel; }

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

    this.chatService.sendMessage({
      id: Date.now().toString(),
      senderId: this.chatCurrentUser.id,
      senderName: this.chatCurrentUser.name,
      senderRole: 'employee',
      receiverId: this.selectedParticipant.id,
      receiverName: this.selectedParticipant.name,
      receiverRole: this.selectedParticipant.id === 'admin' ? 'admin' : 'employee',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      read: false,
    });

    this.newMessage = '';
  }

  getUnreadCount(participantId: string): number {
    if (!this.chatCurrentUser) return 0;
    return this.chatService.getUnreadCountFrom(this.chatCurrentUser.id, participantId);
  }

  get unreadCount(): number {
    if (!this.chatCurrentUser) return 0;
    return this.chatService.getUnreadCount(this.chatCurrentUser.id);
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
  }
}