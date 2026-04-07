import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoriesService } from '../core/services/categories.service';
import { Category } from '../core/models/category.model';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-categories-admin',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule,
    MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Categorías</h1>
      </div>

      <!-- Formulario crear / editar -->
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ editingId() ? 'Editar categoría' : 'Nueva categoría' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-row">
            <mat-form-field appearance="outline" class="field-name">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="name" placeholder="Ej: Frontend" />
            </mat-form-field>

            <div class="color-field">
              <label class="color-label">Color</label>
              <div class="color-preview-wrap">
                <input type="color" formControlName="color" class="color-input" />
                <span class="color-hex">{{ form.value.color }}</span>
              </div>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
                {{ editingId() ? 'Guardar' : 'Crear' }}
              </button>
              @if (editingId()) {
                <button mat-button type="button" (click)="cancelEdit()">Cancelar</button>
              }
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de categorías -->
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <mat-card class="table-card">
          <table mat-table [dataSource]="categories()" class="full-width">
            <!-- Color -->
            <ng-container matColumnDef="color">
              <th mat-header-cell *matHeaderCellDef>Color</th>
              <td mat-cell *matCellDef="let cat">
                <span class="color-dot" [style.background]="cat.color"></span>
              </td>
            </ng-container>

            <!-- Nombre -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let cat">{{ cat.name }}</td>
            </ng-container>

            <!-- Hex -->
            <ng-container matColumnDef="hex">
              <th mat-header-cell *matHeaderCellDef>Hex</th>
              <td mat-cell *matCellDef="let cat" class="hex-cell">{{ cat.color }}</td>
            </ng-container>

            <!-- Acciones -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let cat" class="actions-cell">
                <button mat-icon-button matTooltip="Editar" (click)="startEdit(cat)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Eliminar" (click)="deleteCategory(cat)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <!-- Fila vacía -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-row" colspan="4">No hay categorías creadas.</td>
            </tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { font-size: 1.5rem; font-weight: 600; color: var(--c-text); }

    .form-card { margin-bottom: 24px; }
    .form-row {
      display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;
      padding-top: 8px;
    }
    .field-name { flex: 1; min-width: 180px; }

    .color-field { display: flex; flex-direction: column; gap: 4px; }
    .color-label { font-size: 12px; color: var(--c-text-secondary); }
    .color-preview-wrap { display: flex; align-items: center; gap: 8px; }
    .color-input {
      width: 40px; height: 40px; border: 1px solid var(--c-border);
      border-radius: 8px; cursor: pointer; padding: 2px;
    }
    .color-hex { font-size: 13px; color: var(--c-text-secondary); font-family: monospace; }

    .form-actions { display: flex; gap: 8px; align-items: center; }

    .loading-container { display: flex; justify-content: center; padding: 32px; }

    .table-card { overflow: hidden; }
    .full-width { width: 100%; }

    .color-dot {
      display: inline-block; width: 20px; height: 20px;
      border-radius: 50%; border: 1px solid rgba(0,0,0,0.1);
    }

    .hex-cell { font-family: monospace; font-size: 13px; color: var(--c-text-secondary); }

    .actions-cell { text-align: right; white-space: nowrap; }

    .empty-row { padding: 24px; text-align: center; color: var(--c-text-secondary); }
  `],
})
export class CategoriesAdminComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly displayedColumns = ['color', 'name', 'hex', 'actions'];

  form = this.fb.group({
    name: ['', Validators.required],
    color: ['#6366f1'],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoriesService.getCategories().subscribe({
      next: cats => { this.categories.set(cats); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { name, color } = this.form.value;

    if (this.editingId()) {
      this.categoriesService.updateCategory(this.editingId()!, { name: name!, color: color! }).subscribe({
        next: () => {
          this.snackBar.open('Categoría actualizada', 'Cerrar', { duration: 3000 });
          this.cancelEdit();
          this.loadCategories();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al actualizar';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        },
      });
    } else {
      this.categoriesService.createCategory({ name: name!, color: color! }).subscribe({
        next: () => {
          this.snackBar.open('Categoría creada', 'Cerrar', { duration: 3000 });
          this.form.reset({ name: '', color: '#6366f1' });
          this.loadCategories();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al crear';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        },
      });
    }
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.form.patchValue({ name: cat.name, color: cat.color });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', color: '#6366f1' });
  }

  deleteCategory(cat: Category): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar categoría', message: `¿Eliminar la categoría "${cat.name}"? Si tiene apps asignadas no se podrá eliminar.` },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.categoriesService.deleteCategory(cat.id).subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
          this.loadCategories();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al eliminar';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        },
      });
    });
  }
}
