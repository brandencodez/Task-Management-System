import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { SimpleLayoutComponent } from './shared/layouts/simple-layout/simple-layout';
import { UserLayoutComponent } from './shared/layouts/user-layout/user-layout';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: '',
    component: SimpleLayoutComponent,
    children: [{ path: '', component: HomeComponent }]
  },

  {
  path: 'user-login',
  component: SimpleLayoutComponent,
  children: [
    {
      path: '',
      loadComponent: () => import('./features/auth/user-login/user-login').then(m => m.UserLoginComponent)
    }
  ]
},
  {
    path: 'user-dashboard',
    component: UserLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
        data: { isUserMode: true }
      }
    ]
  },
  {
    path: 'admin-dashboard',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      }
    ]
  },
  {
    path: 'assign-task',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tasks/assign-task/assign-task.component').then(m => m.AssignTaskComponent)
      }
    ]
  },
  {
    path: 'tasks',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
        data: { isUserMode: false } 
      }
    ]
  },
  { path: '**', redirectTo: '' }
];