import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface ProgressFormData {
  currentProgress: number;
}

@Component({
  selector: 'app-progress-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Agregar progreso</h2>
    <mat-dialog-content>
      <div class="current-info">
        <span class="info-label">Progreso actual</span>
        <span class="info-value">{{ data.currentProgress }}%</span>
      </div>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Porcentaje a sumar (1–{{ remaining }})</mat-label>
          <input matInput type="number" formControlName="percentage"
                 min="1" [max]="remaining" />
          <mat-hint>
            Total resultante:
            <strong>{{ resultPreview }}%</strong>
            @if (resultPreview >= 100) { — ¡Tarea completada! }
          </mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Detalle</mat-label>
          <textarea matInput formControlName="detail" rows="4"
                    placeholder="Describí qué avanzaste..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }

    .current-info {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--c-primary-10, #ede9fe);
      border-radius: 8px; padding: 10px 14px;
      margin-bottom: 20px;
    }
    .info-label { font-size: 13px; color: var(--c-text-secondary, #64748b); }
    .info-value { font-size: 18px; font-weight: 700; color: var(--c-primary, #6366f1); }
  `],
})
export class ProgressFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProgressFormComponent>);
  readonly data: ProgressFormData = inject(MAT_DIALOG_DATA) ?? { currentProgress: 0 };

  get remaining(): number {
    return 100 - this.data.currentProgress;
  }

  get resultPreview(): number {
    const val = Number(this.form.value.percentage) || 0;
    return Math.min(this.data.currentProgress + val, 100);
  }

  form = this.fb.group({
    percentage: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(this.remaining)],
    ],
    detail: ['', Validators.required],
  });

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        percentage: this.form.value.percentage,
        detail: this.form.value.detail,
      });
    }
  }
}
