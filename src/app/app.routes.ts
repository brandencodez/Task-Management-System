import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { SimpleLayoutComponent } from './shared/layouts/simple-layout/simple-layout';
import { UserLayoutComponent } from './shared/layouts/user-layout/user-layout';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout';
import { ProjectListComponent } from './features/projects/project-list/project-list.component';
import { UserProjectsComponent } from './features/projects/user-projects/user-projects.component';
import { UserLoginComponent } from './features/auth/user-login/user-login';
import { EmployeeListComponent } from './features/employees/employee-list.component';

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
      loadComponent: () => import('./features/projects/user-projects/user-projects.component').then(m => m.UserProjectsComponent)
    },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/user-projects/user-projects.component').then(m => m.UserProjectsComponent)
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
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employee-list.component').then(m => m.EmployeeListComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
      }
    ]
  },
  
  { path: '**', redirectTo: '' }
];