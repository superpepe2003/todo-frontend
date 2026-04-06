import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Task, TaskProgress } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getTasks(filters?: { appId?: number; status?: string; assignedToId?: number }): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.appId) params = params.set('appId', filters.appId);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.assignedToId) params = params.set('assignedToId', filters.assignedToId);
    return this.http.get<ApiResponse<Task[]>>(`${this.apiUrl}/tasks`, { params }).pipe(map(res => res.data));
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/tasks/${id}`).pipe(map(res => res.data));
  }

  createTask(data: Partial<Task>): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(`${this.apiUrl}/tasks`, data).pipe(map(res => res.data));
  }

  updateTask(id: number, data: Partial<Task>): Observable<Task> {
    return this.http.patch<ApiResponse<Task>>(`${this.apiUrl}/tasks/${id}`, data).pipe(map(res => res.data));
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/tasks/${id}`).pipe(map(() => undefined));
  }

  cancelTask(id: number): Observable<Task> {
    return this.http.patch<ApiResponse<Task>>(`${this.apiUrl}/tasks/${id}/cancel`, {}).pipe(map(res => res.data));
  }

  addProgress(taskId: number, data: { percentage: number; detail: string }): Observable<TaskProgress> {
    return this.http.post<ApiResponse<TaskProgress>>(`${this.apiUrl}/tasks/${taskId}/progress`, data).pipe(map(res => res.data));
  }

  getProgress(taskId: number): Observable<TaskProgress[]> {
    return this.http.get<ApiResponse<TaskProgress[]>>(`${this.apiUrl}/tasks/${taskId}/progress`).pipe(map(res => res.data));
  }
}
