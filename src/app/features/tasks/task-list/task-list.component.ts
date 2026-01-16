import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../task.service';
import { Task } from '../../../shared/models/task.model';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {

  isUserMode = false;
  tasks: Task[] = [];
  selectedTask: Task | null = null;
  showEditModal = false;
  showDeleteModal = false;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    public userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.isUserMode = data['isUserMode'] || false;
      
      // Redirect to login if user mode but no user logged in
      if (this.isUserMode) {
        const user = this.userService.getCurrentUser();
        if (!user) {
          this.router.navigate(['/user-login']);
          return;
        }
      }
      this.loadTasks();
    });
  }

  loadTasks() {
    let allTasks = this.taskService.getTasks();

    if (this.isUserMode) {
      const currentUser = this.userService.getCurrentUser();
      if (currentUser) {
        allTasks = allTasks.filter(task =>
          task.assignedTo.toLowerCase() === currentUser.toLowerCase()
        );
      } else {
        allTasks = [];
      }
    }

    this.tasks = allTasks;
    this.updateStatus();
  }

  updateStatus() {
    const now = Date.now();
    this.tasks.forEach(task => {
      if (task.status === 'COMPLETED') return;

      const diff = new Date(task.endDate).getTime() - now;
      if (diff < 0) {
        task.status = 'OVERDUE';
      } else if (diff < 2 * 24 * 60 * 60 * 1000) {
        task.status = 'WARNING';
      } else {
        task.status = 'ON_TRACK';
      }
    });
  }

  updateUserStatus(task: Task, newStatus: 'ON_TRACK' | 'COMPLETED') {
    const updatedTask = { ...task, status: newStatus };
    this.taskService.updateTask(updatedTask);
    this.loadTasks();
  }

  openEdit(task: Task) {
    if (this.isUserMode) return;
    this.selectedTask = { ...task };
    this.showEditModal = true;
  }

  saveEdit() {
    if (this.selectedTask && !this.isUserMode) {
      this.taskService.updateTask(this.selectedTask);
      this.closeModals();
      this.loadTasks();
    }
  }

  openDelete(task: Task) {
    if (this.isUserMode) return;
    this.selectedTask = task;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.selectedTask && !this.isUserMode) {
      this.taskService.deleteTask(this.selectedTask.id);
      this.closeModals();
      this.loadTasks();
    }
  }

  closeModals() {
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedTask = null;
  }

  setUser(name: string) {
    if (name?.trim()) {
      this.userService.setCurrentUser(name);
      this.loadTasks();
    }
  }
  
  // Logout
  logout() {
    this.userService.clearCurrentUser();
    this.router.navigate(['/user-login']);
  }
}