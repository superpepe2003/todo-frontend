import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, AsyncPipe, NotificationBellComponent],
  template: `
    <header class="navbar">
      <div class="navbar-inner">
        <a routerLink="/dashboard" class="brand">
          <span class="brand-icon">T</span>
          Task Manager
        </a>
        @if (authService.currentUser$ | async; as user) {
          <nav class="nav-links">
            <a mat-button routerLink="/dashboard"
               routerLinkActive="nav-active"
               [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
            <a mat-button routerLink="/apps"
               routerLinkActive="nav-active">Aplicaciones</a>
            <a mat-button routerLink="/tasks"
               routerLinkActive="nav-active">Tareas</a>
            @if (user.role === 'ADMIN') {
              <a mat-button routerLink="/admin/users"
                 routerLinkActive="nav-active">Usuarios</a>
              <a mat-button routerLink="/admin/categories"
                 routerLinkActive="nav-active">Categorías</a>
            }
          </nav>
          <div class="nav-end">
            <app-notification-bell />
            <button mat-button class="logout-btn" (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              <span class="user-name">{{ user.name }}</span>
            </button>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--c-surface);
      border-bottom: 1px solid var(--c-border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      height: 64px;
      display: flex;
      align-items: center;
    }

    .navbar-inner {
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--c-text);
      text-decoration: none;
      margin-right: 16px;
      letter-spacing: -0.01em;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--c-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      line-height: 1;
      flex-shrink: 0;
    }

    .nav-links {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .nav-links a {
      font-size: 14px;
      color: var(--c-text-secondary) !important;
      font-weight: 500;
      position: relative;
      border-radius: 8px !important;
      padding: 6px 12px !important;
      transition: color 150ms, background 150ms;
    }

    .nav-links a:hover {
      color: var(--c-text) !important;
      background: var(--c-primary-10) !important;
    }

    :host ::ng-deep .nav-active {
      color: var(--c-primary) !important;
      background: var(--c-primary-10) !important;
    }

    .nav-end {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--c-text-secondary) !important;
      font-size: 13px !important;
      border-radius: 8px !important;
    }

    .user-name {
      font-weight: 500;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
}
