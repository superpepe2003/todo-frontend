import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppsService } from '../../core/services/apps.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoriesService } from '../../core/services/categories.service';
import { App } from '../../core/models/app.model';
import { Category } from '../../core/models/category.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-apps-list',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Aplicaciones</h1>
        @if (isAdmin) {
          <a mat-raised-button color="primary" routerLink="/admin/apps/new">
            <mat-icon>add</mat-icon> Nueva App
          </a>
        }
      </div>

      <!-- Filtro por categoría -->
      @if (categories().length > 0) {
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="category-filter">
            <mat-label>Categoría</mat-label>
            <mat-select [(value)]="selectedCategoryId" (selectionChange)="onCategoryFilter()">
              <mat-option [value]="null">Todas</mat-option>
              @for (cat of categories(); track cat.id) {
                <mat-option [value]="cat.id">
                  <span class="cat-option">
                    <span class="cat-dot" [style.background]="cat.color"></span>
                    {{ cat.name }}
                  </span>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      }

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
          <p>Cargando aplicaciones…</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon color="warn">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadApps()">
            <mat-icon>refresh</mat-icon> Reintentar
          </button>
        </div>
      } @else {
        <div class="apps-grid">
          @for (app of apps(); track app.id) {
            <mat-card class="app-card">
              <mat-card-header>
                <div mat-card-avatar class="app-avatar">
                  <mat-icon>folder_open</mat-icon>
                </div>
                <mat-card-title>{{ app.name }}</mat-card-title>
                <mat-card-subtitle>{{ app.description || 'Sin descripción' }}</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <!-- Badge de categoría -->
                @if (app.category) {
                  <div class="category-badge"
                       [style.background]="app.category.color + '33'"
                       [style.color]="app.category.color">
                    {{ app.category.name }}
                  </div>
                }

                <div class="progress-section">
                  <div class="progress-label">
                    <span>Progreso promedio</span>
                    <strong>{{ avgProgress(app) }}%</strong>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="avgProgress(app)" />
                </div>

                <div class="status-chips">
                  @if (countByStatus(app, 'PENDING') > 0) {
                    <mat-chip class="chip-pending">{{ countByStatus(app, 'PENDING') }} Pendiente</mat-chip>
                  }
                  @if (countByStatus(app, 'IN_PROGRESS') > 0) {
                    <mat-chip class="chip-inprogress">{{ countByStatus(app, 'IN_PROGRESS') }} En progreso</mat-chip>
                  }
                  @if (countByStatus(app, 'COMPLETED') > 0) {
                    <mat-chip class="chip-completed">{{ countByStatus(app, 'COMPLETED') }} Completada</mat-chip>
                  }
                  @if (countByStatus(app, 'CANCELLED') > 0) {
                    <mat-chip class="chip-cancelled">{{ countByStatus(app, 'CANCELLED') }} Cancelada</mat-chip>
                  }
                  @if (!app.tasks?.length) {
                    <span class="no-tasks">Sin tareas</span>
                  }
                </div>

                <div class="meta">
                  <mat-icon class="meta-icon">people</mat-icon>
                  <span>{{ app.members?.length ?? 0 }} miembros</span>
                </div>
              </mat-card-content>

              <mat-card-actions align="end">
                <a mat-icon-button [routerLink]="['/apps', app.id]" matTooltip="Ver detalle">
                  <mat-icon>open_in_new</mat-icon>
                </a>
                @if (isAdmin) {
                  <a mat-icon-button [routerLink]="['/admin/apps', app.id, 'edit']" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="deleteApp(app)">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon>folder_off</mat-icon>
              <p>No hay aplicaciones disponibles.</p>
              @if (isAdmin) {
                <a mat-raised-button color="primary" routerLink="/admin/apps/new">Crear primera app</a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { font-size: 1.5rem; font-weight: 600; color: var(--c-text); }

    .filter-bar { margin-bottom: 20px; }
    .category-filter { min-width: 200px; }
    .cat-option { display: flex; align-items: center; gap: 8px; }
    .cat-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

    .loading-container, .error-container {
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; padding: 64px; color: var(--c-text-secondary);
    }
    .error-container mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .apps-grid { display: flex; flex-wrap: wrap; gap: 20px; }

    .app-card {
      width: 300px;
      display: flex;
      flex-direction: column;
      border-left: 4px solid var(--c-primary) !important;
      cursor: pointer;
    }
    :host ::ng-deep .app-card mat-card-content { flex: 1; padding: 16px !important; }
    :host ::ng-deep .app-card mat-card-header { padding: 16px 16px 0 !important; }
    :host ::ng-deep .app-card mat-card-actions { padding: 8px 8px 8px !important; }

    .app-avatar {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: var(--c-primary-10);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .app-avatar mat-icon { color: var(--c-primary); font-size: 20px; }

    /* Badge de categoría */
    .category-badge {
      display: inline-block;
      font-size: 11px; font-weight: 600;
      padding: 2px 10px; border-radius: 20px;
      margin-bottom: 10px;
    }

    .progress-section { margin: 4px 0 8px; }
    .progress-label {
      display: flex; justify-content: space-between;
      font-size: 12px; color: var(--c-text-secondary); margin-bottom: 6px;
    }
    .progress-label strong { color: var(--c-primary); }

    .status-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }
    mat-chip { font-size: 11px !important; min-height: 22px !important; padding: 0 8px !important; }
    .chip-pending    { background: #f1f5f9 !important; color: var(--c-text-secondary) !important; }
    .chip-inprogress { background: var(--c-primary-light) !important; color: var(--c-primary) !important; }
    .chip-completed  { background: #d1fae5 !important; color: #059669 !important; }
    .chip-cancelled  { background: #ffe4e6 !important; color: var(--c-warn) !important; }
    .no-tasks { font-size: 12px; color: #c0c8d8; align-self: center; }

    .meta { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--c-text-secondary); margin-top: 6px; }
    .meta-icon { font-size: 14px; width: 14px; height: 14px; }

    :host ::ng-deep .app-card mat-card-actions button,
    :host ::ng-deep .app-card mat-card-actions a {
      opacity: 0;
      transition: opacity 150ms;
    }
    :host ::ng-deep .app-card:hover mat-card-actions button,
    :host ::ng-deep .app-card:hover mat-card-actions a {
      opacity: 1;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 64px; color: #c0c8d8; width: 100%;
    }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; }
    .empty-state p { font-size: 15px; }
  `],
})
export class AppsListComponent implements OnInit {
  private readonly appsService = inject(AppsService);
  private readonly authService = inject(AuthService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly apps = signal<App[]>([]);
  readonly categories = signal<Category[]>([]);

  selectedCategoryId: number | null = null;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(cats => this.categories.set(cats));
    this.loadApps();
  }

  loadApps(): void {
    this.loading.set(true);
    this.error.set(null);
    this.appsService.getApps(this.selectedCategoryId ?? undefined).subscribe({
      next: apps => {
        this.apps.set(apps);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las aplicaciones.');
        this.loading.set(false);
      },
    });
  }

  onCategoryFilter(): void {
    this.loadApps();
  }

  avgProgress(app: App): number {
    const tasks = app.tasks;
    if (!tasks?.length) return 0;
    const sum = tasks.reduce((acc, t) => acc + (t.progress ?? 0), 0);
    return Math.round(sum / tasks.length);
  }

  countByStatus(app: App, status: string): number {
    return app.tasks?.filter(t => t.status === status).length ?? 0;
  }

  deleteApp(app: App): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar app', message: `¿Eliminar "${app.name}"?` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.appsService.deleteApp(app.id).subscribe({
          next: () => {
            this.snackBar.open('App eliminada', 'Cerrar', { duration: 3000 });
            this.loadApps();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }
}
