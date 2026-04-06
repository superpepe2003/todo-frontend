import { Component, Input } from '@angular/core';
import { TaskStatus } from '../../../core/models/task.model';

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; color: string }> = {
  PENDING:     { label: 'Pendiente',    bg: '#f1f5f9', color: '#64748b' },
  IN_PROGRESS: { label: 'En progreso',  bg: '#ede9fe', color: '#6366f1' },
  COMPLETED:   { label: 'Completada',   bg: '#d1fae5', color: '#059669' },
  CANCELLED:   { label: 'Cancelada',    bg: '#ffe4e6', color: '#f43f5e' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [style.background]="cfg.bg" [style.color]="cfg.color">
      {{ cfg.label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.01em;
      white-space: nowrap;
      line-height: 1.4;
    }
  `],
})
export class StatusBadgeComponent {
  @Input() status!: TaskStatus;

  get cfg() {
    return STATUS_CONFIG[this.status] ?? STATUS_CONFIG.PENDING;
  }
}
