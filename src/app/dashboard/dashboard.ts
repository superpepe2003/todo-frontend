import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { TasksService } from '../core/services/tasks.service';
import { AuthService } from '../core/services/auth.service';
import { AppsService } from '../core/services/apps.service';
import { CategoriesService } from '../core/services/categories.service';
import { Task, TaskStatus } from '../core/models/task.model';
import { App } from '../core/models/app.model';
import { Category } from '../core/models/category.model';
import { StatusBadgeComponent } from '../shared/components/status-badge/status-badge';
import { StarRatingComponent } from '../shared/components/star-rating/star-rating';

interface AppStats {
  app: App;
  avgProgress: number;
  counts: Record<TaskStatus, number>;
  totalTasks: number;
}

// Parámetros del donut SVG
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule,
    MatProgressBarModule, MatChipsModule, MatIconModule,
    MatTooltipModule, DatePipe, StatusBadgeComponent, StarRatingComponent,
    MatSelectModule, MatFormFieldModule,
  ],
  template: `
    <div class="page">
      <h1 class="page-title">Dashboard</h1>

      @if (isAdmin) {
        <section class="section">
          <h2 class="section-title">Resumen de aplicaciones</h2>

          <!-- Filtro por categoría (admin) -->
          @if (categories().length > 0) {
            <div class="filter-bar">
              <mat-form-field appearance="outline" class="category-filter">
                <mat-label>Filtrar por categoría</mat-label>
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

          <!-- Barra horizontal de estados global -->
          @if (globalCounts().total > 0) {
            <div class="state-bar-container">
              <div class="state-bar">
                @if (globalCounts().PENDING > 0) {
                  <div class="bar-segment seg-pending"
                       [style.width.%]="pct(globalCounts().PENDING)"
                       [matTooltip]="globalCounts().PENDING + ' pendientes'">
                  </div>
                }
                @if (globalCounts().IN_PROGRESS > 0) {
                  <div class="bar-segment seg-inprogress"
                       [style.width.%]="pct(globalCounts().IN_PROGRESS)"
                       [matTooltip]="globalCounts().IN_PROGRESS + ' en progreso'">
                  </div>
                }
                @if (globalCounts().COMPLETED > 0) {
                  <div class="bar-segment seg-completed"
                       [style.width.%]="pct(globalCounts().COMPLETED)"
                       [matTooltip]="globalCounts().COMPLETED + ' completadas'">
                  </div>
                }
                @if (globalCounts().CANCELLED > 0) {
                  <div class="bar-segment seg-cancelled"
                       [style.width.%]="pct(globalCounts().CANCELLED)"
                       [matTooltip]="globalCounts().CANCELLED + ' canceladas'">
                  </div>
                }
              </div>
              <div class="bar-legend">
                <span class="legend-item"><span class="dot seg-pending"></span>Pendiente ({{ globalCounts().PENDING }})</span>
                <span class="legend-item"><span class="dot seg-inprogress"></span>En progreso ({{ globalCounts().IN_PROGRESS }})</span>
                <span class="legend-item"><span class="dot seg-completed"></span>Completada ({{ globalCounts().COMPLETED }})</span>
                <span class="legend-item"><span class="dot seg-cancelled"></span>Cancelada ({{ globalCounts().CANCELLED }})</span>
              </div>
            </div>
          }

          <!-- Cards con donut por app -->
          <div class="apps-grid">
            @for (stat of appStats(); track stat.app.id) {
              <mat-card class="app-stat-card clickable" [routerLink]="['/apps', stat.app.id]">
                <mat-card-content>
                  <div class="app-stat-inner">
                    <!-- Donut SVG -->
                    <div class="donut-wrapper">
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="28"
                          fill="none" stroke="var(--c-border)" stroke-width="7" />
                        <circle cx="36" cy="36" r="28"
                          fill="none" stroke="var(--c-primary)" stroke-width="7"
                          stroke-linecap="round"
                          [attr.stroke-dasharray]="circumference"
                          [attr.stroke-dashoffset]="dashOffset(stat.avgProgress)"
                          transform="rotate(-90 36 36)" />
                        <text x="36" y="40" text-anchor="middle"
                              font-size="12" font-weight="700" fill="#0f172a">
                          {{ stat.avgProgress }}%
                        </text>
                      </svg>
                    </div>
                    <!-- Info -->
                    <div class="app-stat-info">
                      <p class="app-name">{{ stat.app.name }}</p>
                      <p class="app-tasks-count">{{ stat.totalTasks }} tareas</p>
                      <div class="mini-chips">
                        @if (stat.counts.IN_PROGRESS > 0) {
                          <span class="mini-chip chip-inprogress">{{ stat.counts.IN_PROGRESS }} activas</span>
                        }
                        @if (stat.counts.COMPLETED > 0) {
                          <span class="mini-chip chip-completed">{{ stat.counts.COMPLETED }} listas</span>
                        }
                        @if (stat.counts.PENDING > 0) {
                          <span class="mini-chip chip-pending">{{ stat.counts.PENDING }} pendientes</span>
                        }
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            } @empty {
              <p class="empty-hint">No hay apps con tareas aún.</p>
            }
          </div>
        </section>
      }

      <section class="section">
        <div class="tasks-section-header">
          <h2 class="section-title">Mis tareas activas</h2>
          <!-- Filtro por prioridad mínima -->
          <mat-form-field appearance="outline" class="priority-filter">
            <mat-label>Prioridad</mat-label>
            <mat-select [value]="minPriority()" (selectionChange)="minPriority.set($event.value)">
              <mat-option [value]="1">Todas las prioridades</mat-option>
              <mat-option [value]="3">★★★ 3+</mat-option>
              <mat-option [value]="4">★★★★ 4+</mat-option>
              <mat-option [value]="5">★★★★★ 5</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="tasks-grid">
          @for (task of activeTasks(); track task.id) {
            <mat-card class="task-card" [class.task-overdue]="task.isOverdue">
              <mat-card-content>
                <div class="task-top">
                  <div class="task-badges">
                    <app-status-badge [status]="task.status" />
                    @if (task.isOverdue) {
                      <span class="overdue-badge">
                        <mat-icon>schedule</mat-icon> Vencida
                      </span>
                    }
                    @if (task.isOverdue && (task.priority ?? 3) >= 4) {
                      <span class="urgent-badge">URGENTE</span>
                    }
                  </div>
                  <a mat-icon-button [routerLink]="['/tasks', task.id]" matTooltip="Ver detalle">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </div>
                <h3 class="task-title">{{ task.title }}</h3>
                <div class="task-stars">
                  <app-star-rating [value]="task.priority ?? 3" [readonly]="true" />
                </div>
                <div class="task-meta">
                  <mat-icon class="meta-icon">folder_open</mat-icon>
                  <span>{{ task.app?.name }}</span>
                  @if (task.deadline) {
                    <span class="meta-sep">·</span>
                    <mat-icon class="meta-icon">event</mat-icon>
                    <span>{{ task.deadline | date:'dd/MM/yyyy' }}</span>
                  }
                </div>
                <div class="task-progress">
                  <mat-progress-bar mode="determinate" [value]="task.progress" />
                  <span class="progress-pct">{{ task.progress }}%</span>
                </div>
              </mat-card-content>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon>task_alt</mat-icon>
              <p>{{ minPriority() > 1 ? 'No hay tareas con esa prioridad.' : 'No tenés tareas activas.' }}</p>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 600; color: var(--c-text); margin-bottom: 28px; }

    .filter-bar { margin-bottom: 16px; }
    .category-filter { min-width: 220px; }
    .cat-option { display: flex; align-items: center; gap: 8px; }
    .cat-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

    .section { margin-bottom: 40px; }
    .section-title {
      font-size: 13px; font-weight: 500; color: var(--c-text-secondary);
      margin-bottom: 16px; letter-spacing: 0.02em;
    }

    /* Barra de estados global */
    .state-bar-container { margin-bottom: 20px; }
    .state-bar {
      display: flex; height: 8px; border-radius: 6px; overflow: hidden;
      background: var(--c-border); margin-bottom: 10px;
    }
    .bar-segment { height: 100%; transition: width 0.4s ease; cursor: default; }
    .bar-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--c-text-secondary); }
    .legend-item { display: flex; align-items: center; gap: 5px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    .seg-pending    { background-color: #94a3b8; }
    .seg-inprogress { background-color: var(--c-primary); }
    .seg-completed  { background-color: #10b981; }
    .seg-cancelled  { background-color: var(--c-warn); }

    /* Cards de apps con donut */
    .apps-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .app-stat-card {
      width: 240px; cursor: pointer;
      border-left: 4px solid var(--c-primary) !important;
    }
    :host ::ng-deep .app-stat-card .mat-mdc-card-content { padding: 16px !important; }

    .app-stat-inner { display: flex; align-items: center; gap: 14px; }
    .donut-wrapper { flex-shrink: 0; }

    .app-stat-info { flex: 1; min-width: 0; }
    .app-name { font-weight: 600; font-size: 13px; color: var(--c-text); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .app-tasks-count { font-size: 12px; color: var(--c-text-secondary); margin: 0 0 8px; }

    .mini-chips { display: flex; gap: 5px; flex-wrap: wrap; }
    .mini-chip { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; }
    .chip-pending    { background: #f1f5f9; color: var(--c-text-secondary); }
    .chip-inprogress { background: var(--c-primary-light); color: var(--c-primary); }
    .chip-completed  { background: #d1fae5; color: #059669; }

    /* Tasks grid */
    .tasks-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .task-card { width: 300px; }
    :host ::ng-deep .task-card .mat-mdc-card-content { padding: 16px !important; }

    .task-overdue { border-left: 3px solid var(--c-warn) !important; }

    .task-top {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 8px;
    }
    .task-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

    .overdue-badge {
      display: inline-flex; align-items: center; gap: 3px;
      background: #ffe4e6; color: var(--c-warn);
      border-radius: 20px; padding: 2px 8px;
      font-size: 11px; font-weight: 600;
    }
    .overdue-badge mat-icon { font-size: 12px; width: 12px; height: 12px; }

    .task-title { font-size: 14px; font-weight: 600; color: var(--c-text); margin: 0 0 8px; line-height: 1.4; }

    .task-meta {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--c-text-secondary); margin-bottom: 12px;
    }
    .meta-icon { font-size: 13px; width: 13px; height: 13px; }
    .meta-sep { color: var(--c-border); }

    .tasks-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .tasks-section-header .section-title { margin-bottom: 0; }
    .priority-filter { min-width: 180px; }

    .task-stars { margin: 4px 0 8px; }

    .urgent-badge {
      display: inline-flex; align-items: center;
      background: #f43f5e; color: white;
      border-radius: 4px; padding: 1px 7px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
    }

    .task-progress { display: flex; align-items: center; gap: 10px; }
    .task-progress mat-progress-bar { flex: 1; }
    .progress-pct { font-size: 12px; font-weight: 600; color: var(--c-primary); white-space: nowrap; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: #c0c8d8; text-align: center;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { font-size: 14px; margin: 0; }
    .empty-hint { font-size: 13px; color: var(--c-text-secondary); }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly authService = inject(AuthService);
  private readonly appsService = inject(AppsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly circumference = CIRCUMFERENCE;

  readonly allActiveTasks = signal<Task[]>([]);
  readonly appStats = signal<AppStats[]>([]);
  readonly globalCounts = signal<Record<TaskStatus, number> & { total: number }>({
    PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, total: 0,
  });
  readonly categories = signal<Category[]>([]);

  selectedCategoryId: number | null = null;
  minPriority = signal<number>(1);

  readonly activeTasks = computed(() => {
    const min = this.minPriority();
    return this.allActiveTasks().filter(t => (t.priority ?? 3) >= min);
  });

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    // Cargar tareas activas en paralelo (sin anidar subscribes)
    forkJoin([
      this.tasksService.getTasks({ status: 'PENDING' }),
      this.tasksService.getTasks({ status: 'IN_PROGRESS' }),
    ]).subscribe(([pending, inProgress]) => {
      const sorted = [...pending, ...inProgress].sort((a, b) => {
        // 1. Prioridad DESC
        const pDiff = (b.priority ?? 3) - (a.priority ?? 3);
        if (pDiff !== 0) return pDiff;
        // 2. Deadline ASC
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
      this.allActiveTasks.set(sorted);
    });

    if (this.isAdmin) {
      this.categoriesService.getCategories().subscribe(cats => this.categories.set(cats));
      this.loadAdminApps();
    }
  }

  onCategoryFilter(): void {
    this.loadAdminApps();
  }

  private loadAdminApps(): void {
    this.appsService.getApps(this.selectedCategoryId ?? undefined).subscribe(apps => {
      const stats = apps.map(app => this.buildStats(app));
      this.appStats.set(stats);
      this.buildGlobalCounts(stats);
    });
  }

  dashOffset(progress: number): number {
    return CIRCUMFERENCE * (1 - progress / 100);
  }

  pct(count: number): number {
    return this.globalCounts().total > 0
      ? Math.round((count / this.globalCounts().total) * 100)
      : 0;
  }

  private buildStats(app: App): AppStats {
    const tasks = app.tasks ?? [];
    const counts: Record<TaskStatus, number> = {
      PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0,
    };
    let progressSum = 0;

    for (const t of tasks) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
      progressSum += t.progress ?? 0;
    }

    return {
      app,
      avgProgress: tasks.length ? Math.round(progressSum / tasks.length) : 0,
      counts,
      totalTasks: tasks.length,
    };
  }

  private buildGlobalCounts(stats: AppStats[]): void {
    const totals: Record<TaskStatus, number> = {
      PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0,
    };
    for (const s of stats) {
      (Object.keys(s.counts) as TaskStatus[]).forEach(k => (totals[k] += s.counts[k]));
    }
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    this.globalCounts.set({ ...totals, total });
  }
}
