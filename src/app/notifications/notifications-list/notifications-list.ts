import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [RouterLink, MatListModule, MatButtonModule, MatIconModule, MatDividerModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Notificaciones</h1>
        @if (notifications().length > 0) {
          <button mat-button (click)="markAllRead()">Marcar todas como leídas</button>
        }
      </div>
      <mat-list>
        @for (n of notifications(); track n.id) {
          <mat-list-item [class.unread]="!n.read">
            <mat-icon matListItemIcon>{{ n.read ? 'notifications_none' : 'notifications_active' }}</mat-icon>
            <span matListItemTitle>{{ n.message }}</span>
            <span matListItemLine>{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            <div matListItemMeta>
              @if (!n.read) {
                <button mat-icon-button (click)="markRead(n)">
                  <mat-icon>done</mat-icon>
                </button>
              }
              @if (n.task) {
                <a mat-icon-button [routerLink]="['/tasks', n.task.id]">
                  <mat-icon>open_in_new</mat-icon>
                </a>
              }
            </div>
          </mat-list-item>
          <mat-divider />
        } @empty {
          <mat-list-item>No hay notificaciones.</mat-list-item>
        }
      </mat-list>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .unread { background-color: #e3f2fd; }
  `],
})
export class NotificationsListComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly notifications = signal<Notification[]>([]);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationsService.getNotifications().subscribe(n => this.notifications.set(n));
  }

  markRead(notification: Notification): void {
    this.notificationsService.markRead(notification.id).subscribe(() => {
      // Actualiza el signal con una nueva referencia
      this.notifications.update(list =>
        list.map(n => n.id === notification.id ? { ...n, read: true } : n),
      );
      this.notificationsService.refreshUnreadCount();
    });
  }

  markAllRead(): void {
    this.notificationsService.markAllRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
      this.snackBar.open('Todas marcadas como leídas', 'Cerrar', { duration: 3000 });
    });
  }
}
