import {
  ChangeDetectionStrategy,
  Component,
  model,
} from '@angular/core';

/**
 * Five labeled mood chips — Heavy / Tense / Flat / Steady / Full — mapping
 * to ratings 1–5. Single-select; `value` is a model signal so the host can
 * two-way bind (`[(value)]`) or listen to `valueChange`.
 */

export interface RatingChip {
  readonly value: number;
  readonly label: string;
}

const CHIPS: readonly RatingChip[] = [
  { value: 1, label: 'Heavy' },
  { value: 2, label: 'Tense' },
  { value: 3, label: 'Flat' },
  { value: 4, label: 'Steady' },
  { value: 5, label: 'Full' },
];

@Component({
  selector: 'sh-rating-chips',
  standalone: true,
  templateUrl: './rating-chips.html',
  styleUrl: './rating-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingChips {
  /** Selected rating (1–5) or null when nothing is chosen yet. */
  readonly value = model<number | null>(null);

  protected readonly chips = CHIPS;

  protected select(rating: number): void {
    this.value.set(rating);
  }

  protected isSelected(rating: number): boolean {
    return this.value() === rating;
  }
}
