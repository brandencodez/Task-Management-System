import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../task.service';
import { Task } from '../../../shared/models/task.model';

@Component({
  selector: 'app-assign-task',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './assign-task.component.html',
  styleUrls: ['./assign-task.component.css']
})
export class AssignTaskComponent {
  task: Partial<Task> = {
    title: '',
    description: '',
    assignedTo: '',
    startDate: '',
    endDate: ''
  };

  // Toast notification state
  showToast = false;
  toastMessage = '';

  constructor(
    private taskService: TaskService,
    private router: Router
  ) {}

  assignTask() {
    if (!this.task.title || !this.task.assignedTo || !this.task.startDate || !this.task.endDate) {
      return;
    }

    if (new Date(this.task.endDate!) < new Date(this.task.startDate!)) {
      this.showNotification('End date must be after start date');
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title: this.task.title!,
      description: this.task.description!,
      assignedTo: this.task.assignedTo!,
      startDate: this.task.startDate!,
      endDate: this.task.endDate!,
      status: 'ON_TRACK'
    };

    this.taskService.addTask(newTask);
    this.showNotification('Task assigned successfully!');
    
    // redirect after delay
    setTimeout(() => {
      this.router.navigate(['/admin-dashboard']);
    }, 1500);
  }

  showNotification(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000); // Hide after 3 seconds
  }
}