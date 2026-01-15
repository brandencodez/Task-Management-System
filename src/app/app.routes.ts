import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TaskListComponent } from './features/tasks/task-list/task-list.component';
import { AssignTaskComponent } from './features/tasks/assign-task/assign-task.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'assign-task', component: AssignTaskComponent },
  { path: 'tasks', component: TaskListComponent }
];
