import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppsService } from '../../core/services/apps.service';
import { CategoriesService } from '../../core/services/categories.service';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-app-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule,
  ],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-header><mat-card-title>{{ isEdit ? 'Editar' : 'Nueva' }} Aplicación</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Categoría (opcional)</mat-label>
              <mat-select formControlName="categoryId">
                <mat-option [value]="null">Sin categoría</mat-option>
                @for (cat of categories(); track cat.id) {
                  <mat-option [value]="cat.id">
                    <span class="cat-option">
                      <span class="cat-dot" [style.background]="cat.color"></span>
                      {{ cat.name }}
                    </span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div class="actions">
              <button mat-button type="button" (click)="router.navigate(['/apps'])">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
                {{ isEdit ? 'Guardar' : 'Crear' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 600px; margin: 0 auto; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    .cat-option { display: flex; align-items: center; gap: 8px; }
    .cat-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `],
})
export class AppFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appsService = inject(AppsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isEdit = false;
  appId: number | null = null;
  readonly categories = signal<Category[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    categoryId: [null as number | null],
  });

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(cats => this.categories.set(cats));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.appId = Number(id);
      this.appsService.getApp(this.appId).subscribe(app => {
        this.form.patchValue({
          name: app.name,
          description: app.description ?? '',
          categoryId: app.categoryId ?? null,
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { name, description, categoryId } = this.form.value;
    const data = {
      name: name!,
      description: description ?? undefined,
      categoryId: categoryId ?? undefined,
    };

    const request = this.isEdit
      ? this.appsService.updateApp(this.appId!, data)
      : this.appsService.createApp(data);

    request.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'App actualizada' : 'App creada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/apps']);
      },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
