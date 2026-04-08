import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { TasksService } from '../../core/services/tasks.service';
import { AppsService } from '../../core/services/apps.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskStatus } from '../../core/models/task.model';
import { App } from '../../core/models/app.model';
import { User } from '../../core/models/user.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule, DatePipe,
    StatusBadgeComponent, StarRatingComponent,
  ],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Tareas</h1>
          <p class="subtitle">{{ filteredTasks().length }} tarea{{ filteredTasks().length !== 1 ? 's' : '' }}</p>
        </div>
        @if (isAdmin) {
          <a mat-raised-button color="primary" routerLink="/admin/tasks/new">
            <mat-icon>add</mat-icon> Nueva Tarea
          </a>
        }
      </div>

      <!-- Filtros -->
      <div class="filters-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Aplicación</mat-label>
          <mat-select [value]="filterAppId()" (selectionChange)="filterAppId.set($event.value)">
            <mat-option [value]="null">Todas</mat-option>
            @for (app of apps(); track app.id) {
              <mat-option [value]="app.id">{{ app.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Estado</mat-label>
          <mat-select [value]="filterStatus()" (selectionChange)="filterStatus.set($event.value)">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="PENDING">Pendiente</mat-option>
            <mat-option value="IN_PROGRESS">En progreso</mat-option>
            <mat-option value="COMPLETED">Completada</mat-option>
            <mat-option value="CANCELLED">Cancelada</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Filtro por usuario: solo ADMIN -->
        @if (isAdmin) {
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Asignada a</mat-label>
            <mat-select [value]="filterUserId()" (selectionChange)="filterUserId.set($event.value)">
              <mat-option [value]="null">Todos los usuarios</mat-option>
              @for (u of users(); track u.id) {
                <mat-option [value]="u.id">{{ u.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </div>

      <!-- Lista -->
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
          <p>Cargando tareas…</p>
        </div>
      } @else if (filteredTasks().length === 0) {
        <div class="empty-state">
          <mat-icon>assignment</mat-icon>
          <p>No hay tareas que coincidan.</p>
          @if (isAdmin) {
            <a mat-raised-button color="primary" routerLink="/admin/tasks/new">Crear primera tarea</a>
          }
        </div>
      } @else {
        <div class="tasks-grid">
          @for (task of filteredTasks(); track task.id) {
            <mat-card class="task-card" [class.task-overdue]="task.isOverdue">
              <mat-card-content>

                <!-- Top row: app tag + status + actions -->
                <div class="card-top">
                  <div class="card-top-left">
                    <span class="app-tag">
                      <mat-icon>folder_open</mat-icon>
                      {{ task.app?.name ?? 'Sin app' }}
                    </span>
                    <app-status-badge [status]="task.status" />
                    @if (task.isOverdue) {
                      <span class="overdue-badge">
                        <mat-icon>schedule</mat-icon> Vencida
                      </span>
                    }
                  </div>
                  <div class="card-actions">
                    <a mat-icon-button [routerLink]="['/tasks', task.id]" matTooltip="Ver detalle">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                    @if (isAdmin) {
                      <a mat-icon-button [routerLink]="['/admin/tasks', task.id, 'edit']" matTooltip="Editar">
                        <mat-icon>edit</mat-icon>
                      </a>
                      @if (task.status !== 'CANCELLED') {
                        <button mat-icon-button color="warn" matTooltip="Cancelar" (click)="cancelTask(task)">
                          <mat-icon>cancel</mat-icon>
                        </button>
                      }
                    }
                  </div>
                </div>

                <!-- Título + prioridad -->
                <h3 class="task-title">{{ task.title }}</h3>
                <div class="task-priority">
                  <app-star-rating [value]="task.priority" [readonly]="true" />
                </div>

                <!-- Meta: asignado + deadline + tipo -->
                <div class="task-meta">
                  <span class="meta-item">
                    <mat-icon>person</mat-icon>
                    {{ task.assignedTo?.name ?? 'Sin asignar' }}
                  </span>
                  @if (task.deadline) {
                    <span class="meta-item" [class.meta-overdue]="task.isOverdue">
                      <mat-icon>event</mat-icon>
                      {{ task.deadline | date:'dd/MM/yyyy' }}
                    </span>
                  }
                  <span class="meta-item">
                    <mat-icon>code</mat-icon>
                    {{ task.type }}
                  </span>
                </div>

                <!-- Progreso -->
                <div class="progress-row">
                  <mat-progress-bar mode="determinate" [value]="task.progress" />
                  <span class="progress-pct">{{ task.progress }}%</span>
                </div>

              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .page-header h1 { font-size: 1.5rem; font-weight: 600; color: var(--c-text); margin: 0 0 2px; }
    .subtitle { font-size: 13px; color: var(--c-text-secondary); margin: 0; }

    .filters-bar {
      display: flex; gap: 12px; flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .filter-field { width: 200px; }
    :host ::ng-deep .filter-field .mat-mdc-form-field-subscript-wrapper { display: none; }

    .loading-container {
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; padding: 64px; color: var(--c-text-secondary);
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .task-card { border-left: 4px solid var(--c-border) !important; }
    .task-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover) !important; }
    .task-overdue { border-left-color: var(--c-warn) !important; }
    :host ::ng-deep .task-card .mat-mdc-card-content { padding: 16px !important; }

    .card-top {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 10px; gap: 8px;
    }
    .card-top-left { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; }
    .card-actions { display: flex; align-items: center; gap: 0; flex-shrink: 0; }

    .app-tag {
      display: inline-flex; align-items: center; gap: 3px;
      background: var(--c-primary-10); color: var(--c-primary);
      border-radius: 6px; padding: 2px 8px;
      font-size: 11px; font-weight: 600;
    }
    .app-tag mat-icon { font-size: 12px; width: 12px; height: 12px; }

    .overdue-badge {
      display: inline-flex; align-items: center; gap: 3px;
      background: #ffe4e6; color: var(--c-warn);
      border-radius: 20px; padding: 2px 8px;
      font-size: 11px; font-weight: 600;
    }
    .overdue-badge mat-icon { font-size: 12px; width: 12px; height: 12px; }

    .task-title { font-size: 14px; font-weight: 600; color: var(--c-text); margin: 0 0 4px; line-height: 1.4; }

    .task-priority { margin-bottom: 10px; }

    .task-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .meta-item {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 12px; color: var(--c-text-secondary);
    }
    .meta-item mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .meta-overdue { color: var(--c-warn) !important; font-weight: 500; }

    .progress-row { display: flex; align-items: center; gap: 10px; }
    .progress-row mat-progress-bar { flex: 1; }
    .progress-pct { font-size: 12px; font-weight: 700; color: var(--c-primary); white-space: nowrap; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 64px; color: #c0c8d8; text-align: center;
    }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; }
    .empty-state p { font-size: 15px; margin: 0; }
  `],
})
export class TasksListComponent implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly appsService = inject(AppsService);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly tasks = signal<Task[]>([]);
  readonly apps = signal<App[]>([]);
  readonly users = signal<User[]>([]);

  readonly filterAppId = signal<number | null>(null);
  readonly filterStatus = signal<TaskStatus | null>(null);
  readonly filterUserId = signal<number | null>(null);

  readonly filteredTasks = computed(() => {
    let list = this.tasks();
    const appId = this.filterAppId();
    const status = this.filterStatus();
    const userId = this.filterUserId();
    if (appId) list = list.filter(t => t.appId === appId);
    if (status) list = list.filter(t => t.status === status);
    if (userId) list = list.filter(t => t.assignedToId === userId);
    return list;
  });

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loading.set(true);

    this.tasksService.getTasks().subscribe({
      next: tasks => { this.tasks.set(tasks); this.loading.set(false); },
      error: () => { this.snackBar.open('Error al cargar tareas', 'Cerrar', { duration: 3000 }); this.loading.set(false); },
    });

    this.appsService.getApps().subscribe({
      next: apps => this.apps.set(apps),
    });

    if (this.isAdmin) {
      this.usersService.getUsers().subscribe({
        next: users => this.users.set(users),
      });
    }
  }

  cancelTask(task: Task): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancelar tarea', message: `¿Cancelar "${task.title}"?` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.tasksService.cancelTask(task.id).subscribe({
          next: updated => {
            this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
            this.snackBar.open('Tarea cancelada', 'Cerrar', { duration: 3000 });
          },
          error: () => this.snackBar.open('Error al cancelar', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }
}
