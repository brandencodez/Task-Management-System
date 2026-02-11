import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { SimpleLayoutComponent } from './shared/layouts/simple-layout/simple-layout';
import { UserLayoutComponent } from './shared/layouts/user-layout/user-layout';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout';
import { UserAttendanceComponent } from './features/attendance/user-attendance/user-attendance.component';
import { AdminAttendanceComponent } from './features/attendance/admin-attendance/admin-attendance.component';

export const routes: Routes = [

  // ================= HOME =================
  {
    path: '',
    component: SimpleLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      }
    ]
  },

  // ================= USER LOGIN =================
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
  // ===== Admin LOGIN =====
  {
    path: 'admin-login',
    component: SimpleLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/admin-login/admin-login')
            .then(m => m.AdminLoginComponent)
      }
    ]
  },

  // ================= USER DASHBOARD =================
  {
    path: 'user-dashboard',
    component: UserLayoutComponent,
    children: [

      // 🔹 Default → My Projects
      {
        path: '',
        loadComponent: () =>
          import('./features/projects/user-projects/user-projects.component')
            .then(m => m.UserProjectsComponent)
      },

      // 🔹 Work Entry
      {
        path: 'work-entry',
        loadComponent: () =>
          import(
            './features/projects/work-entry-dashboard/work-entry-dashboard.component'
          ).then(m => m.WorkEntryDashboardComponent)
      },

      /* ✅ USER ATTENDANCE
      {
        path: 'attendance',
        component: UserAttendanceComponent,
        title: 'My Attendance'
      }*/
    ] 
  },

  {
  path: 'authpage',
  component: SimpleLayoutComponent,
  children: [
    {
      path: '',
      loadComponent: () =>
        import('./features/auth/authpage/authpage')
          .then(m => m.Authpage)
    }
  ]
},

  // ================= ADMIN DASHBOARD =================
  {
    path: 'admin-dashboard',
    component: AdminLayoutComponent,
    children: [

      // 🔹 Admin Home
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
        
   {
  path: 'departments',
  loadComponent: () =>
    import('./features/department/department-list.component')
      .then(m => m.DepartmentListComponent)
},


      // 🔹 Employees
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/employee-list.component')
            .then(m => m.EmployeeListComponent)
      },

      // 🔹 Projects
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component')
            .then(m => m.ProjectListComponent)
      },

      // 🔔 Reminders
      {
        path: 'reminders',
        loadComponent: () =>
          import('./features/reminders/reminder-list/reminder-list.component')
            .then(m => m.ReminderListComponent)
      },

      // 📊 WORK ENTRY SUMMARY 
      {
        path: 'work-summary',
        loadComponent: () =>
          import('./shared/components/work-entry-summary-today/work-entry-summary-today.component')
            .then(m => m.WorkEntrySummaryTodayComponent)
      }
    ]
  },

 
  // ===== ATTENDANCE ROUTES =====

  {
    path: 'my-attendance',
    component: UserAttendanceComponent,
    title: 'My Attendance'
  },
  {
    path: 'admin/attendance',
    component: AdminAttendanceComponent,
    title: 'Attendance Management'
  },
  

  
  // ================= FALLBACK =================
  {
    path: '**',
    redirectTo: ''
  }
];