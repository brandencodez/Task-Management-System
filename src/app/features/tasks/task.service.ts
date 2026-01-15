import { Injectable } from '@angular/core';
import { Task } from '../../shared/models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private storageKey = 'tasks';

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  getTasks(): Task[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  addTask(task: Task) {
    const tasks = this.getTasks();
    tasks.push(task);
    this.save(tasks);
  }

  updateTask(updatedTask: Task) {
    const tasks = this.getTasks().map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    this.save(tasks);
  }

  deleteTask(taskId: number) {
    const tasks = this.getTasks().filter(task => task.id !== taskId);
    this.save(tasks);
  }

  private save(tasks: Task[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }
}
