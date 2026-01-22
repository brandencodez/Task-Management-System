import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { SimpleLayoutComponent } from './shared/layouts/simple-layout/simple-layout';
import { UserLayoutComponent } from './shared/layouts/user-layout/user-layout';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout';

export const routes: Routes = [

  // ===== HOME =====
  {
    path: '',
    component: SimpleLayoutComponent,
    children: [
      { path: '', component: HomeComponent }
    ]
  },

  // ===== USER LOGIN =====
  {
    path: 'user-login',
    component: SimpleLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/user-login/user-login')
            .then(m => m.UserLoginComponent)
      }
    ]
  },

  // ===== USER DASHBOARD =====
  {
    path: 'user-dashboard',
    component: UserLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/projects/user-projects/user-projects.component')
            .then(m => m.UserProjectsComponent)
      },

      // ✅ WORK ENTRY DASHBOARD (FIXED PATH)
      {
        path: 'work-entry',
        loadComponent: () =>
          import(
            './features/projects/work-entry-dashboard/work-entry-dashboard.component'
          ).then(m => m.WorkEntryDashboardComponent)
      }
    ]
  },

  // ===== ADMIN DASHBOARD =====
  {
    path: 'admin-dashboard',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/employee-list.component')
            .then(m => m.EmployeeListComponent)
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component')
            .then(m => m.ProjectListComponent)
      }
    ]
  },

  // ===== FALLBACK =====
  { path: '**', redirectTo: '' }
];
