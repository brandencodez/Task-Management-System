import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

  constructor(private taskService: TaskService) {}

  assignTask() {
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
    alert('Task assigned successfully');

    this.task = {};
  }
}
