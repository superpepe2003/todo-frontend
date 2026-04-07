import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { UsersService } from '../../core/services/users.service';
import { TasksService } from '../../core/services/tasks.service';
import { User } from '../../core/models/user.model';
import { Task } from '../../core/models/task.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    RouterLink, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <a mat-icon-button routerLink="/admin/users" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1>Detalle de usuario</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48" />
        </div>
      } @else if (user()) {
        <!-- Info del usuario -->
        <mat-card class="user-card">
          <mat-card-content>
            <div class="user-info">
              <div class="user-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="user-data">
                <h2 class="user-name">{{ user()!.name }}</h2>
                <p class="user-email">
                  <mat-icon class="inline-icon">email</mat-icon>
                  {{ user()!.email }}
                </p>
                <span class="role-badge" [class.role-admin]="user()!.role === 'ADMIN'">
                  {{ user()!.role === 'ADMIN' ? 'Administrador' : 'Usuario' }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tareas asignadas -->
        <section class="tasks-section">
          <h2 class="section-title">
            Tareas asignadas
            <span class="task-count">{{ tasks().length }}</span>
          </h2>

          @if (loadingTasks()) {
            <div class="loading-container">
              <mat-spinner diameter="36" />
            </div>
          } @else if (tasks().length === 0) {
            <div class="empty-state">
              <mat-icon>task_alt</mat-icon>
              <p>Sin tareas asignadas</p>
            </div>
          } @else {
            <div class="tasks-list">
              @for (task of tasks(); track task.id) {
                <a class="task-row" [routerLink]="['/tasks', task.id]">
                  <div class="task-main">
                    <span class="task-title">{{ task.title }}</span>
                    <span class="task-app">
                      <mat-icon class="meta-icon">folder_open</mat-icon>
                      {{ task.app?.name ?? '—' }}
                    </span>
                  </div>
                  <div class="task-meta">
                    <app-status-badge [status]="task.status" />
                    <div class="task-progress">
                      <mat-progress-bar mode="determinate" [value]="task.progress" class="progress-bar" />
                      <span class="progress-pct">{{ task.progress }}%</span>
                    </div>
                    @if (task.deadline) {
                      <span class="deadline" [class.overdue]="task.isOverdue">
                        <mat-icon class="meta-icon">event</mat-icon>
                        {{ task.deadline | date:'dd/MM/yyyy' }}
                      </span>
                    }
                    <mat-icon class="chevron">chevron_right</mat-icon>
                  </div>
                </a>
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 800px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 24px;
    }
    .page-header h1 { font-size: 1.4rem; font-weight: 600; color: var(--c-text); margin: 0; }
    .back-btn { color: var(--c-text-secondary) !important; }

    .loading-container { display: flex; justify-content: center; padding: 48px; }

    /* Tarjeta usuario */
    .user-card { margin-bottom: 28px; }
    :host ::ng-deep .user-card .mat-mdc-card-content { padding: 20px !important; }

    .user-info { display: flex; align-items: center; gap: 20px; }

    .user-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--c-primary-10);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .user-avatar mat-icon { color: var(--c-primary); font-size: 28px; width: 28px; height: 28px; }

    .user-data { flex: 1; }
    .user-name { font-size: 1.1rem; font-weight: 600; color: var(--c-text); margin: 0 0 4px; }
    .user-email {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px; color: var(--c-text-secondary); margin: 0 0 10px;
    }
    .inline-icon { font-size: 15px; width: 15px; height: 15px; }

    .role-badge {
      display: inline-block;
      padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      background: #f1f5f9; color: var(--c-text-secondary);
    }
    .role-admin { background: var(--c-primary-10); color: var(--c-primary); }

    /* Sección tareas */
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 600; color: var(--c-text); margin-bottom: 12px;
    }
    .task-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px; padding: 0 6px;
      border-radius: 12px; background: var(--c-primary-10);
      color: var(--c-primary); font-size: 12px; font-weight: 700;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: #c0c8d8;
      border: 1px dashed var(--c-border); border-radius: 12px;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-state p { font-size: 14px; margin: 0; }

    /* Lista de tareas */
    .tasks-list { display: flex; flex-direction: column; gap: 1px; }

    .task-row {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 14px 16px;
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: 10px;
      text-decoration: none;
      color: inherit;
      transition: background 150ms, border-color 150ms;
      margin-bottom: 6px;
      cursor: pointer;
    }
    .task-row:hover { background: var(--c-primary-10); border-color: var(--c-primary); }

    .task-main { flex: 1; min-width: 0; }
    .task-title {
      display: block; font-size: 14px; font-weight: 600;
      color: var(--c-text); margin-bottom: 3px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .task-app {
      display: flex; align-items: center; gap: 3px;
      font-size: 12px; color: var(--c-text-secondary);
    }

    .task-meta {
      display: flex; align-items: center; gap: 12px; flex-shrink: 0; flex-wrap: wrap;
    }

    .task-progress { display: flex; align-items: center; gap: 8px; }
    .progress-bar { width: 80px; }
    .progress-pct { font-size: 12px; font-weight: 600; color: var(--c-primary); white-space: nowrap; }

    .meta-icon { font-size: 13px; width: 13px; height: 13px; }

    .deadline {
      display: flex; align-items: center; gap: 3px;
      font-size: 12px; color: var(--c-text-secondary);
    }
    .deadline.overdue { color: var(--c-warn); font-weight: 600; }

    .chevron { color: var(--c-border); font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
  `],
})
export class UserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usersService = inject(UsersService);
  private readonly tasksService = inject(TasksService);

  readonly loading = signal(true);
  readonly loadingTasks = signal(true);
  readonly user = signal<User | null>(null);
  readonly tasks = signal<Task[]>([]);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.usersService.getUser(id).subscribe({
      next: u => { this.user.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.tasksService.getTasks({ assignedToId: id }).subscribe({
      next: tasks => { this.tasks.set(tasks); this.loadingTasks.set(false); },
      error: () => this.loadingTasks.set(false),
    });
  }
}
