import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, AsyncPipe, NotificationBellComponent],
  template: `
    <header class="navbar">
      <div class="navbar-inner">

        <!-- Brand -->
        <a routerLink="/dashboard" class="brand" (click)="closeMenu()">
          <span class="brand-icon">T</span>
          <span class="brand-text">Task Manager</span>
        </a>

        @if (authService.currentUser$ | async; as user) {

          <!-- Links escritorio -->
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

          <!-- Derecha: campana + logout (siempre visible) -->
          <div class="nav-end">
            <app-notification-bell />
            <button mat-button class="logout-btn" (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              <span class="user-name">{{ user.name }}</span>
            </button>
          </div>

          <!-- Hamburguesa (solo móvil) -->
          <button class="hamburger" mat-icon-button (click)="toggleMenu()" aria-label="Menú">
            <mat-icon>{{ menuOpen() ? 'close' : 'menu' }}</mat-icon>
          </button>
        }
      </div>
    </header>

    <!-- Panel móvil -->
    @if (menuOpen()) {
      @if (authService.currentUser$ | async; as user) {
        <nav class="mobile-menu">
          <a class="mobile-link" routerLink="/dashboard"
             routerLinkActive="mobile-active"
             [routerLinkActiveOptions]="{ exact: true }"
             (click)="closeMenu()">
            <mat-icon>dashboard</mat-icon> Dashboard
          </a>
          <a class="mobile-link" routerLink="/apps"
             routerLinkActive="mobile-active"
             (click)="closeMenu()">
            <mat-icon>folder_open</mat-icon> Aplicaciones
          </a>
          <a class="mobile-link" routerLink="/tasks"
             routerLinkActive="mobile-active"
             (click)="closeMenu()">
            <mat-icon>assignment</mat-icon> Tareas
          </a>
          @if (user.role === 'ADMIN') {
            <a class="mobile-link" routerLink="/admin/users"
               routerLinkActive="mobile-active"
               (click)="closeMenu()">
              <mat-icon>people</mat-icon> Usuarios
            </a>
            <a class="mobile-link" routerLink="/admin/categories"
               routerLinkActive="mobile-active"
               (click)="closeMenu()">
              <mat-icon>label</mat-icon> Categorías
            </a>
          }
          <div class="mobile-divider"></div>
          <button class="mobile-logout" (click)="logout()">
            <mat-icon>logout</mat-icon> Cerrar sesión ({{ user.name }})
          </button>
        </nav>
      }
    }
  `,
  styles: [`
    /* ── Navbar principal ── */
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

    /* Brand */
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
      flex-shrink: 0;
    }

    .brand-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: var(--c-primary);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; line-height: 1;
      flex-shrink: 0;
    }

    /* Links escritorio */
    .nav-links {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .nav-links a {
      font-size: 14px;
      color: var(--c-text-secondary) !important;
      font-weight: 500;
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

    /* Derecha escritorio */
    .nav-end {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }

    .logout-btn {
      display: flex; align-items: center; gap: 6px;
      color: var(--c-text-secondary) !important;
      font-size: 13px !important;
      border-radius: 8px !important;
    }

    .user-name {
      font-weight: 500;
      max-width: 120px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* Hamburguesa: oculto en escritorio */
    .hamburger {
      display: none;
      margin-left: auto;
      color: var(--c-text) !important;
    }

    /* ── Panel móvil ── */
    .mobile-menu {
      position: sticky;
      top: 64px;
      z-index: 99;
      background: var(--c-surface);
      border-bottom: 1px solid var(--c-border);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      padding: 8px 0;
    }

    .mobile-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 500;
      color: var(--c-text-secondary);
      text-decoration: none;
      transition: background 150ms, color 150ms;
    }
    .mobile-link mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .mobile-link:hover { background: var(--c-primary-10); color: var(--c-text); }

    :host ::ng-deep .mobile-active {
      color: var(--c-primary) !important;
      background: var(--c-primary-10) !important;
    }

    .mobile-divider {
      height: 1px;
      background: var(--c-border);
      margin: 8px 0;
    }

    .mobile-logout {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px;
      font-size: 15px; font-weight: 500;
      color: var(--c-text-secondary);
      background: none; border: none; cursor: pointer;
      width: 100%; text-align: left;
      transition: background 150ms, color 150ms;
    }
    .mobile-logout mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .mobile-logout:hover { background: #ffe4e6; color: var(--c-warn); }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .nav-links { display: none; }
      .nav-end   { display: none; }
      .hamburger { display: flex; }
      .brand-text { display: none; }
      .navbar-inner { padding: 0 16px; }
    }
  `],
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);

  constructor() {
    // Cerrar el menú al navegar
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => this.menuOpen.set(false));
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.authService.logout();
  }
}
