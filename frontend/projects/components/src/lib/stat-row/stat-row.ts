import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Compact label / value / meta row (recent workouts, last meal). The
 * design's "Bike · 24 min        Tue": `label` left and semibold, optional
 * `value` beside it, `meta` right-aligned and quiet.
 */
@Component({
  selector: 'sh-stat-row',
  standalone: true,
  templateUrl: './stat-row.html',
  styleUrl: './stat-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRow {
  readonly label = input.required<string>();
  readonly value = input<string>();
  readonly meta = input<string>();
}
