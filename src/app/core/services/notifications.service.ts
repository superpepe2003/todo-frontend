import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  getNotifications(): Observable<Notification[]> {
    return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}/notifications`).pipe(
      map(res => res.data),
      tap(notifications => {
        const unread = notifications.filter(n => !n.read).length;
        this.unreadCountSubject.next(unread);
      }),
    );
  }

  markRead(id: number): Observable<void> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/notifications/${id}/read`, {}).pipe(map(() => undefined));
  }

  markAllRead(): Observable<void> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/notifications/read-all`, {}).pipe(
      map(() => undefined),
      tap(() => this.unreadCountSubject.next(0)),
    );
  }

  refreshUnreadCount(): void {
    this.getNotifications().subscribe();
  }
}
