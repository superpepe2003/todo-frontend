import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { TasksService } from '../../core/services/tasks.service';
import { AuthService } from '../../core/services/auth.service';
import { Task } from '../../core/models/task.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { ProgressFormComponent } from '../progress-form/progress-form';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, DatePipe, StatusBadgeComponent, StarRatingComponent],
  template: `
    @if (task()) {
      <div class="page">

        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <a mat-button routerLink="/tasks" class="back-link">
              <mat-icon>arrow_back</mat-icon> Volver
            </a>
            <h1>{{ task()!.title }}</h1>
            <app-status-badge [status]="task()!.status" />
            @if (task()!.isOverdue) {
              <span class="overdue-badge">
                <mat-icon>schedule</mat-icon> Vencida
              </span>
            }
          </div>
          <div class="header-actions">
            @if (isAdmin) {
              <a mat-button [routerLink]="['/admin/tasks', task()!.id, 'edit']">
                <mat-icon>edit</mat-icon> Editar
              </a>
              @if (task()!.status !== 'CANCELLED') {
                <button mat-button color="warn" (click)="cancelTask()">
                  <mat-icon>cancel</mat-icon> Cancelar
                </button>
              }
            }
            @if (canAddProgress()) {
              <button mat-raised-button color="primary" (click)="openProgressForm()">
                <mat-icon>add</mat-icon> Agregar progreso
              </button>
            }
          </div>
        </div>

        <!-- Info card -->
        <mat-card class="info-card">
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon class="info-icon">folder_open</mat-icon>
                <div>
                  <p class="info-label">Aplicación</p>
                  <p class="info-value">{{ task()!.app?.name ?? '-' }}</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon class="info-icon">code</mat-icon>
                <div>
                  <p class="info-label">Tipo</p>
                  <p class="info-value">{{ task()!.type }}</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon class="info-icon">person</mat-icon>
                <div>
                  <p class="info-label">Asignada a</p>
                  <p class="info-value">{{ task()!.assignedTo?.name ?? 'Sin asignar' }}</p>
                </div>
              </div>
              @if (task()!.deadline) {
                <div class="info-item" [class.overdue-item]="task()!.isOverdue">
                  <mat-icon class="info-icon">event</mat-icon>
                  <div>
                    <p class="info-label">Deadline</p>
                    <p class="info-value">{{ task()!.deadline | date:'dd/MM/yyyy' }}</p>
                  </div>
                </div>
              }
              <div class="info-item">
                <mat-icon class="info-icon">star</mat-icon>
                <div>
                  <p class="info-label">Prioridad</p>
                  <app-star-rating [value]="task()!.priority" [readonly]="true" />
                </div>
              </div>
            </div>

            @if (task()!.description) {
              <div class="description-block">
                <p class="info-label">Descripción</p>
                <p class="description-text">{{ task()!.description }}</p>
              </div>
            }

            <!-- Progreso -->
            <div class="progress-block">
              <div class="progress-header">
                <span class="info-label">Progreso</span>
                <span class="progress-pct">{{ task()!.progress }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="task()!.progress" />
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Timeline de progreso -->
        <section class="timeline-section">
          <h2>Historial de progreso</h2>
          <div class="timeline">
            @for (log of task()!.progressLogs; track log.id) {
              <div class="timeline-item">
                <div class="timeline-left">
                  <div class="timeline-avatar">{{ initial(log.user?.name) }}</div>
                  <div class="timeline-line"></div>
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-name">{{ log.user?.name }}</span>
                    <span class="timeline-pct">{{ log.percentage }}%</span>
                    <span class="timeline-date">{{ log.createdAt | date:'dd/MM/yyyy · HH:mm' }}</span>
                  </div>
                  <p class="timeline-detail">{{ log.detail }}</p>
                </div>
              </div>
            } @empty {
              <div class="timeline-empty">
                <mat-icon>history</mat-icon>
                <p>Sin registros de progreso aún.</p>
              </div>
            }
          </div>
        </section>

      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .header-left { display: flex; flex-direction: column; gap: 8px; }
    .header-left h1 { font-size: 1.5rem; font-weight: 600; color: var(--c-text); }
    .header-left > div { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 8px; }

    .back-link { color: var(--c-text-secondary) !important; margin-bottom: 4px; }

    .overdue-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #ffe4e6; color: var(--c-warn);
      border-radius: 20px; padding: 3px 10px;
      font-size: 12px; font-weight: 600;
    }
    .overdue-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Info card */
    .info-card { margin-bottom: 28px; }
    :host ::ng-deep .info-card .mat-mdc-card-content { padding: 24px !important; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-item {
      display: flex; align-items: flex-start; gap: 12px;
    }
    .info-item.overdue-item .info-value { color: var(--c-warn); font-weight: 500; }

    .info-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--c-primary); margin-top: 2px; flex-shrink: 0;
    }

    .info-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--c-text-secondary);
      margin: 0 0 3px;
    }
    .info-value { font-size: 14px; font-weight: 500; color: var(--c-text); margin: 0; }

    .description-block { margin-bottom: 20px; }
    .description-text { font-size: 14px; color: var(--c-text); margin: 6px 0 0; line-height: 1.6; }

    .progress-block { margin-top: 4px; }
    .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .progress-pct { font-size: 14px; font-weight: 600; color: var(--c-primary); }

    /* Timeline */
    .timeline-section h2 { font-size: 1rem; font-weight: 600; color: var(--c-text); margin-bottom: 20px; }

    .timeline { display: flex; flex-direction: column; }

    .timeline-item {
      display: flex; gap: 0; min-height: 64px;
    }

    .timeline-left {
      display: flex; flex-direction: column; align-items: center;
      width: 40px; flex-shrink: 0; margin-right: 16px;
    }

    .timeline-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--c-primary-10); color: var(--c-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
      border: 2px solid var(--c-primary);
    }

    .timeline-line {
      flex: 1; width: 2px; background: var(--c-border);
      margin: 4px 0; min-height: 16px;
    }
    .timeline-item:last-child .timeline-line { display: none; }

    .timeline-content {
      flex: 1; padding-bottom: 20px;
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      padding: 14px 16px 14px;
      margin-bottom: 12px;
    }

    .timeline-header {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .timeline-name { font-weight: 600; font-size: 13px; color: var(--c-text); }
    .timeline-pct {
      background: var(--c-primary-light); color: var(--c-primary);
      border-radius: 20px; padding: 1px 8px; font-size: 12px; font-weight: 600;
    }
    .timeline-date { font-size: 12px; color: var(--c-text-secondary); margin-left: auto; }
    .timeline-detail { font-size: 13px; color: var(--c-text); margin: 0; line-height: 1.6; }

    .timeline-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 40px; color: #c0c8d8; text-align: center;
    }
    .timeline-empty mat-icon { font-size: 40px; width: 40px; height: 40px; }
  `],
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tasksService = inject(TasksService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly task = signal<Task | null>(null);

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  readonly canAddProgress = computed(() => {
    const t = this.task();
    if (!t || t.status === 'CANCELLED' || t.status === 'COMPLETED') return false;
    if (this.authService.isAdmin()) return true;
    return t.assignedToId === this.authService.currentUser?.id;
  });

  initial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  ngOnInit(): void {
    this.loadTask();
  }

  loadTask(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.tasksService.getTask(id).subscribe(task => this.task.set(task));
  }

  openProgressForm(): void {
    const ref = this.dialog.open(ProgressFormComponent, {
      width: '500px',
      data: { currentProgress: this.task()!.progress },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.tasksService.addProgress(this.task()!.id, result).subscribe({
          next: () => {
            this.snackBar.open('Progreso registrado', 'Cerrar', { duration: 3000 });
            this.loadTask();
          },
          error: () => this.snackBar.open('Error al registrar', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }

  cancelTask(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancelar tarea', message: '¿Cancelar esta tarea?' },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.tasksService.cancelTask(this.task()!.id).subscribe({
          next: updated => {
            this.task.set(updated);
            this.snackBar.open('Tarea cancelada', 'Cerrar', { duration: 3000 });
          },
          error: () => this.snackBar.open('Error al cancelar', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }
}
