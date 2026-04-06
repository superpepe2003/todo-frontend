import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AsyncPipe } from '@angular/common';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatBadgeModule, AsyncPipe],
  template: `
    <a mat-icon-button routerLink="/notifications">
      @if ((notificationsService.unreadCount$ | async) ?? 0; as count) {
        <mat-icon [matBadge]="count" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
      } @else {
        <mat-icon>notifications</mat-icon>
      }
    </a>
  `,
})
export class NotificationBellComponent implements OnInit {
  readonly notificationsService = inject(NotificationsService);

  ngOnInit(): void {
    this.notificationsService.refreshUnreadCount();
  }
}
