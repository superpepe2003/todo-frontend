import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`).pipe(map(res => res.data));
  }

  createCategory(data: { name: string; color?: string }): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(`${this.apiUrl}/categories`, data).pipe(map(res => res.data));
  }

  updateCategory(id: number, data: { name?: string; color?: string }): Observable<Category> {
    return this.http.patch<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`, data).pipe(map(res => res.data));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/categories/${id}`).pipe(map(() => undefined));
  }
}
