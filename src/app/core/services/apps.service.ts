import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { App } from '../models/app.model';

@Injectable({ providedIn: 'root' })
export class AppsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getApps(): Observable<App[]> {
    return this.http.get<ApiResponse<App[]>>(`${this.apiUrl}/apps`).pipe(map(res => res.data));
  }

  getApp(id: number): Observable<App> {
    return this.http.get<ApiResponse<App>>(`${this.apiUrl}/apps/${id}`).pipe(map(res => res.data));
  }

  createApp(data: { name: string; description?: string }): Observable<App> {
    return this.http.post<ApiResponse<App>>(`${this.apiUrl}/apps`, data).pipe(map(res => res.data));
  }

  updateApp(id: number, data: { name?: string; description?: string }): Observable<App> {
    return this.http.patch<ApiResponse<App>>(`${this.apiUrl}/apps/${id}`, data).pipe(map(res => res.data));
  }

  deleteApp(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/apps/${id}`).pipe(map(() => undefined));
  }

  addMember(appId: number, userId: number): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/apps/${appId}/members`, { userId }).pipe(map(res => res.data));
  }

  removeMember(appId: number, userId: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/apps/${appId}/members/${userId}`).pipe(map(() => undefined));
  }
}
