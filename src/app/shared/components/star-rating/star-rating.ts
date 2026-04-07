import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="stars" [class.editable]="!readonly">
      @for (star of stars; track star) {
        <mat-icon
          class="star"
          [class.filled]="star <= displayValue()"
          (mouseenter)="!readonly && hoverValue.set(star)"
          (mouseleave)="!readonly && hoverValue.set(0)"
          (click)="!readonly && select(star)">
          {{ star <= displayValue() ? 'star' : 'star_border' }}
        </mat-icon>
      }
    </div>
  `,
  styles: [`
    .stars {
      display: inline-flex;
      align-items: center;
      gap: 1px;
      line-height: 1;
    }
    .star {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #d1d5db;
      transition: color 100ms, transform 80ms;
      user-select: none;
    }
    .star.filled { color: #f59e0b; }
    .editable .star { cursor: pointer; }
    .editable .star:hover { transform: scale(1.2); }
  `],
})
export class StarRatingComponent {
  @Input() value: number = 3;
  @Input() readonly: boolean = false;
  @Output() valueChange = new EventEmitter<number>();

  readonly stars = [1, 2, 3, 4, 5];
  readonly hoverValue = signal(0);

  displayValue(): number {
    return this.hoverValue() || this.value;
  }

  select(star: number): void {
    this.valueChange.emit(star);
  }
}
