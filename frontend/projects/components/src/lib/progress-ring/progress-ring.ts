import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * SVG progress ring (the fasting ring in the design). `progress` is 0–1
 * and is clamped; the arc starts at 12 o'clock. Center content (elapsed
 * time, "of 16 hours") is projected so the ring stays purely presentational.
 */
@Component({
  selector: 'sh-progress-ring',
  standalone: true,
  templateUrl: './progress-ring.html',
  styleUrl: './progress-ring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRing {
  /** Fraction complete, 0–1 (values outside are clamped). */
  readonly progress = input.required<number>();
  /** Outer diameter in px. */
  readonly size = input<number>(64);
  /** Ring thickness in px; defaults to ~1/9 of the size. */
  readonly stroke = input<number | null>(null);

  protected readonly strokeWidth = computed(
    () => this.stroke() ?? Math.max(4, Math.round(this.size() / 9)),
  );

  protected readonly radius = computed(
    () => (this.size() - this.strokeWidth()) / 2,
  );

  protected readonly circumference = computed(
    () => 2 * Math.PI * this.radius(),
  );

  protected readonly clamped = computed(
    () => Math.min(1, Math.max(0, this.progress())),
  );

  protected readonly dashOffset = computed(
    () => this.circumference() * (1 - this.clamped()),
  );
}
