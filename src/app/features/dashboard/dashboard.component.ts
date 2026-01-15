import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../tasks/task.service';
import { Task } from '../../shared/models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  totalTasks = 0;
  onTrack = 0;
  warning = 0;
  overdue = 0;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    const tasks: Task[] = this.taskService.getTasks();

    this.totalTasks = tasks.length;
    this.onTrack = tasks.filter(t => t.status === 'ON_TRACK').length;
    this.warning = tasks.filter(t => t.status === 'WARNING').length;
    this.overdue = tasks.filter(t => t.status === 'OVERDUE').length;
  }
}
