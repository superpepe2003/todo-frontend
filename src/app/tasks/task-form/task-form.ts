import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TasksService } from '../../core/services/tasks.service';
import { AppsService } from '../../core/services/apps.service';
import { UsersService } from '../../core/services/users.service';
import { App } from '../../core/models/app.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSelectModule],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-header><mat-card-title>{{ isEdit ? 'Editar' : 'Nueva' }} Tarea</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Título</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipo</mat-label>
              <mat-select formControlName="type">
                <mat-option value="BACKEND">Backend</mat-option>
                <mat-option value="FRONTEND">Frontend</mat-option>
                <mat-option value="FULLSTACK">Fullstack</mat-option>
                <mat-option value="OTHER">Otro</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Aplicación</mat-label>
              <mat-select formControlName="appId">
                @for (app of apps(); track app.id) {
                  <mat-option [value]="app.id">{{ app.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Asignar a</mat-label>
              <mat-select formControlName="assignedToId">
                <mat-option [value]="null">Sin asignar</mat-option>
                @for (user of users(); track user.id) {
                  <mat-option [value]="user.id">{{ user.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Días hábiles para deadline</mat-label>
              <input matInput type="number" formControlName="deadlineDays" min="1" />
            </mat-form-field>
            <div class="actions">
              <button mat-button type="button" (click)="router.navigate(['/tasks'])">Cancelar</button>
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
  `],
})
export class TaskFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tasksService = inject(TasksService);
  private readonly appsService = inject(AppsService);
  private readonly usersService = inject(UsersService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isEdit = false;
  taskId: number | null = null;
  readonly apps = signal<App[]>([]);
  readonly users = signal<User[]>([]);

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    type: ['BACKEND'],
    appId: [null as number | null, Validators.required],
    assignedToId: [null as number | null],
    deadlineDays: [null as number | null],
  });

  ngOnInit(): void {
    this.appsService.getApps().subscribe(apps => this.apps.set(apps));
    this.usersService.getUsers().subscribe(users => this.users.set(users));

    // Modo edición: lee el id de la tarea desde la ruta
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.taskId = Number(id);
      this.tasksService.getTask(this.taskId).subscribe(task => {
        this.form.patchValue({
          title: task.title,
          description: task.description ?? '',
          type: task.type,
          appId: task.appId,
          assignedToId: task.assignedToId ?? null,
          deadlineDays: task.deadlineDays ?? null,
        });
      });
      return;
    }

    // Modo creación: pre-llena appId si viene de app-detail
    const appIdParam = this.route.snapshot.queryParamMap.get('appId');
    if (appIdParam) {
      this.form.patchValue({ appId: Number(appIdParam) });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const raw: any = { ...this.form.value };

    // appId no existe en UpdateTaskDto — no enviarlo en modo edición
    const data: any = this.isEdit
      ? { title: raw.title, description: raw.description, type: raw.type, assignedToId: raw.assignedToId, deadlineDays: raw.deadlineDays }
      : { ...raw };

    if (!data.assignedToId) delete data.assignedToId;
    if (!data.deadlineDays) delete data.deadlineDays;
    if (data.description === '') delete data.description;

    const request = this.isEdit
      ? this.tasksService.updateTask(this.taskId!, data)
      : this.tasksService.createTask(data);

    request.subscribe({
      next: task => {
        this.snackBar.open(this.isEdit ? 'Tarea actualizada' : 'Tarea creada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/tasks', task.id]);  // ir al detalle de la tarea creada/editada
      },
      error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 }),
    });
  }
}
