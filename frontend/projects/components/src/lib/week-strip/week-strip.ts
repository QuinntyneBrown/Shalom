import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Per-day state for the week strip. Grace-forward by design: there is no
 * "missed" state — a quiet day is `grace`, a day not yet reached is `ahead`.
 */
export type WeekDayState = 'done' | 'grace' | 'ahead';

/**
 * Seven dots, Monday-first, with the done/grace/ahead legend — the
 * "This week" rhythm strip from the Health design. Purely presentational;
 * the host computes the states from fasting history + workouts.
 */
@Component({
  selector: 'sh-week-strip',
  standalone: true,
  templateUrl: './week-strip.html',
  styleUrl: './week-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekStrip {
  /** Exactly seven states, Monday first. */
  readonly states = input.required<WeekDayState[]>();

  protected readonly labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

  protected readonly days = computed(() =>
    this.labels.map((label, i) => ({
      label,
      state: this.states()[i] ?? 'ahead',
    })),
  );
}
