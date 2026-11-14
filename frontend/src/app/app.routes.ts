import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: 'Dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'board', title: 'Board', loadComponent: () => import('./features/board/board.component').then((m) => m.BoardComponent) },
      { path: 'tasks', title: 'Tasks', loadComponent: () => import('./features/tasks/task-list.component').then((m) => m.TaskListComponent) },
      { path: 'settings', title: 'Settings', loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
