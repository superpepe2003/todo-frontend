import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/users`).pipe(map(res => res.data));
  }

  getUser(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/${id}`).pipe(map(res => res.data));
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/users/${id}`, data).pipe(map(res => res.data));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/users/${id}`).pipe(map(() => undefined));
  }

  updateRole(id: number, role: string): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/users/${id}/role`, { role }).pipe(map(res => res.data));
  }
}
