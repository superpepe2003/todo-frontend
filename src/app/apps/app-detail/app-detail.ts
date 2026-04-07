import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DatePipe } from '@angular/common';
import { AppsService } from '../../core/services/apps.service';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { App } from '../../core/models/app.model';
import { Task } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';

@Component({
  selector: 'app-app-detail',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatTableModule,
    MatIconModule, MatChipsModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule,
    DatePipe, StatusBadgeComponent, StarRatingComponent,
  ],
  template: `
    @if (app()) {
      <div class="page">

        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <a mat-button routerLink="/apps" class="back-link">
              <mat-icon>arrow_back</mat-icon> Volver
            </a>
            <h1>{{ app()!.name }}</h1>
            @if (app()!.description) {
              <p class="description">{{ app()!.description }}</p>
            }
          </div>
          @if (isAdmin) {
            <div class="header-actions">
              <a mat-button [routerLink]="['/admin/apps', app()!.id, 'edit']">
                <mat-icon>edit</mat-icon> Editar
              </a>
              <a mat-raised-button color="primary"
                 [routerLink]="['/admin/tasks/new']"
                 [queryParams]="{ appId: app()!.id }">
                <mat-icon>add</mat-icon> Nueva Tarea
              </a>
            </div>
          }
        </div>

        <!-- Tareas -->
        <section class="section">
          <div class="section-header">
            <h2>Tareas <span class="count">{{ filteredTasks().length }}</span></h2>

            <!-- Filtro por usuario -->
            @if (isAdmin && users().length > 0) {
              <mat-form-field appearance="outline" class="user-filter">
                <mat-label>Filtrar por usuario</mat-label>
                <mat-select [value]="selectedUserId()" (selectionChange)="selectedUserId.set($event.value)">
                  <mat-option [value]="null">Todos los usuarios</mat-option>
                  @for (u of users(); track u.id) {
                    <mat-option [value]="u.id">{{ u.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </div>

          @if (filteredTasks().length > 0) {
            <table mat-table [dataSource]="filteredTasks()" class="full-width table-zebra">
              <ng-container matColumnDef="priority">
                <th mat-header-cell *matHeaderCellDef>Prioridad</th>
                <td mat-cell *matCellDef="let t">
                  <app-star-rating [value]="t.priority ?? 3" [readonly]="true" />
                </td>
              </ng-container>
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Título</th>
                <td mat-cell *matCellDef="let t">
                  <span class="task-title">{{ t.title }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let t"><app-status-badge [status]="t.status" /></td>
              </ng-container>
              <ng-container matColumnDef="assignedTo">
                <th mat-header-cell *matHeaderCellDef>Asignada a</th>
                <td mat-cell *matCellDef="let t">{{ t.assignedTo?.name ?? '-' }}</td>
              </ng-container>
              <ng-container matColumnDef="deadline">
                <th mat-header-cell *matHeaderCellDef>Deadline</th>
                <td mat-cell *matCellDef="let t"
                    [class.cell-overdue]="t.isOverdue">
                  {{ t.deadline ? (t.deadline | date:'dd/MM/yyyy') : '-' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef>Progreso</th>
                <td mat-cell *matCellDef="let t">
                  <span class="progress-cell">{{ t.progress }}%</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let t">
                  <a mat-icon-button [routerLink]="['/tasks', t.id]" matTooltip="Ver detalle">
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="task-row"></tr>
            </table>
          } @else {
            <div class="empty-tasks">
              <mat-icon>assignment</mat-icon>
              <p>{{ selectedUserId() ? 'Sin tareas para este usuario.' : 'No hay tareas en esta app aún.' }}</p>
              @if (isAdmin && !selectedUserId()) {
                <a mat-raised-button color="primary"
                   [routerLink]="['/admin/tasks/new']"
                   [queryParams]="{ appId: app()!.id }">
                  Crear la primera tarea
                </a>
              }
            </div>
          }
        </section>

        <!-- Miembros -->
        <section class="section">
          <h2>Miembros <span class="count">{{ app()!.members?.length ?? 0 }}</span></h2>
          <div class="members-list">
            @for (m of app()!.members; track m.id) {
              <div class="member-chip">
                <span class="member-avatar">{{ initial(m.user?.name) }}</span>
                <span class="member-name">{{ m.user?.name }}</span>
                <span class="member-role">{{ m.user?.role }}</span>
              </div>
            } @empty {
              <p class="empty-hint">Sin miembros asignados.</p>
            }
          </div>
        </section>

      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .header-left h1 { font-size: 1.5rem; font-weight: 600; color: var(--c-text); margin: 0; }
    .header-actions { display: flex; gap: 8px; align-items: center; padding-top: 8px; flex-wrap: wrap; }
    .back-link { color: var(--c-text-secondary) !important; margin-bottom: 4px; }
    .description { font-size: 14px; color: var(--c-text-secondary); margin: 0; }

    .section { margin-bottom: 36px; }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
    }

    h2 { font-size: 1rem; font-weight: 600; color: var(--c-text); margin-bottom: 12px; }
    .count {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--c-primary-10); color: var(--c-primary);
      border-radius: 20px; padding: 1px 9px; font-size: 12px; font-weight: 600;
      margin-left: 6px; vertical-align: middle;
    }

    .user-filter { min-width: 200px; margin-bottom: 0; }

    .full-width { width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid var(--c-border); }
    .task-title { font-weight: 500; color: var(--c-text); font-size: 13px; }
    .cell-overdue { color: var(--c-warn); font-weight: 500; }
    .progress-cell { font-weight: 600; color: var(--c-primary); font-size: 13px; }
    .task-row { cursor: default; }

    .members-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .member-chip {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--c-surface); border: 1px solid var(--c-border);
      border-radius: 24px; padding: 6px 14px 6px 8px;
    }
    .member-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--c-primary-10); color: var(--c-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .member-name { font-size: 13px; font-weight: 500; color: var(--c-text); }
    .member-role { font-size: 11px; color: var(--c-text-secondary); text-transform: lowercase; }

    .empty-tasks {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #c0c8d8; text-align: center;
    }
    .empty-tasks mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-tasks p { font-size: 14px; margin: 0; }
    .empty-hint { font-size: 13px; color: var(--c-text-secondary); margin: 0; }
  `],
})
export class AppDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly appsService = inject(AppsService);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  readonly app = signal<App | null>(null);
  readonly allTasks = signal<Task[]>([]);
  readonly users = signal<User[]>([]);
  readonly selectedUserId = signal<number | null>(null);

  readonly filteredTasks = computed(() => {
    const uid = this.selectedUserId();
    if (!uid) return this.allTasks();
    return this.allTasks().filter(t => t.assignedToId === uid);
  });

  displayedColumns = ['priority', 'title', 'status', 'assignedTo', 'deadline', 'progress', 'actions'];

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  initial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.appsService.getApp(id).subscribe(app => {
      this.app.set(app);
      // Ordenar las tareas embebidas por priority DESC, luego deadline ASC
      const sorted = [...(app.tasks ?? [])].sort((a, b) => {
        const pDiff = (b.priority ?? 3) - (a.priority ?? 3);
        if (pDiff !== 0) return pDiff;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
      this.allTasks.set(sorted);
    });

    if (this.isAdmin) {
      this.usersService.getUsers().subscribe(users => this.users.set(users));
    }
  }

}
