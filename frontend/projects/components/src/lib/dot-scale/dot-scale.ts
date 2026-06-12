import {
  ChangeDetectionStrategy,
  Component,
  model,
} from '@angular/core';

/**
 * Four-dot closeness scale, Far → Near, mapping to 1–4. Single-select;
 * `value` is a model signal so the host can two-way bind (`[(value)]`).
 */
@Component({
  selector: 'sh-dot-scale',
  standalone: true,
  templateUrl: './dot-scale.html',
  styleUrl: './dot-scale.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DotScale {
  /** Selected step (1–4) or null when nothing is chosen yet. */
  readonly value = model<number | null>(null);

  protected readonly dots = [1, 2, 3, 4] as const;

  protected select(step: number): void {
    this.value.set(step);
  }

  protected isSelected(step: number): boolean {
    return this.value() === step;
  }
}
