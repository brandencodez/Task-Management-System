import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../task.service';
import { Task } from '../../../shared/models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {

  tasks: Task[] = [];

  selectedTask: Task | null = null;
  showEditModal = false;
  showDeleteModal = false;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.tasks = this.taskService.getTasks();
    this.updateStatus();
  }

  updateStatus() {
    const now = Date.now();
    this.tasks.forEach(task => {
      const diff = new Date(task.endDate).getTime() - now;
      if (diff < 0) task.status = 'OVERDUE';
      else if (diff < 24 * 60 * 60 * 1000) task.status = 'WARNING';
      else task.status = 'ON_TRACK';
    });
  }

  openEdit(task: Task) {
    this.selectedTask = { ...task };
    this.showEditModal = true;
  }

  saveEdit() {
    if (this.selectedTask) {
      this.taskService.updateTask(this.selectedTask);
      this.closeModals();
      this.loadTasks();
    }
  }

  openDelete(task: Task) {
    this.selectedTask = task;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.selectedTask) {
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
}
