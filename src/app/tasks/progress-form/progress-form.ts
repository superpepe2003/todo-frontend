import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-progress-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSliderModule],
  template: `
    <h2 mat-dialog-title>Agregar progreso</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Porcentaje (0-100)</mat-label>
          <input matInput type="number" formControlName="percentage" min="0" max="100" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Detalle</mat-label>
          <textarea matInput formControlName="detail" rows="4" placeholder="Describí qué avanzaste..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; margin-bottom: 8px; }'],
})
export class ProgressFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProgressFormComponent>);

  form = this.fb.group({
    percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    detail: ['', Validators.required],
  });

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close({ percentage: this.form.value.percentage, detail: this.form.value.detail });
    }
  }
}
