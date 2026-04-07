import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'apps',
        loadComponent: () => import('./apps/apps-list/apps-list').then(m => m.AppsListComponent),
      },
      {
        path: 'apps/:id',
        loadComponent: () => import('./apps/app-detail/app-detail').then(m => m.AppDetailComponent),
      },
      {
        path: 'tasks',
        loadComponent: () => import('./tasks/tasks-list/tasks-list').then(m => m.TasksListComponent),
      },
      {
        path: 'tasks/:id',
        loadComponent: () => import('./tasks/task-detail/task-detail').then(m => m.TaskDetailComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications-list/notifications-list').then(m => m.NotificationsListComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'apps/new',
            loadComponent: () => import('./apps/app-form/app-form').then(m => m.AppFormComponent),
          },
          {
            path: 'apps/:id/edit',
            loadComponent: () => import('./apps/app-form/app-form').then(m => m.AppFormComponent),
          },
          {
            path: 'tasks/new',
            loadComponent: () => import('./tasks/task-form/task-form').then(m => m.TaskFormComponent),
          },
          {
            path: 'tasks/:id/edit',
            loadComponent: () => import('./tasks/task-form/task-form').then(m => m.TaskFormComponent),
          },
          {
            path: 'users',
            loadComponent: () => import('./users/users-list/users-list').then(m => m.UsersListComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
