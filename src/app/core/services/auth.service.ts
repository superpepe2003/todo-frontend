import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http
      .post<ApiResponse<{ token: string; user: User }>>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        map(res => res.data),
        tap(data => {
          localStorage.setItem(TOKEN_KEY, data.token);
          this.currentUserSubject.next(data.user);
        }),
      );
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.apiUrl}/auth/register`, { name, email, password })
      .pipe(map(res => res.data));
  }

  loadCurrentUser(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.apiUrl}/auth/me`)
      .pipe(
        map(res => res.data),
        tap(user => this.currentUserSubject.next(user)),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
