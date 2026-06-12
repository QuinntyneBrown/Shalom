import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * Today's reading from the active plan: plan name, day number, passage,
 * progress, a YouVersion link (new tab), and either a "Mark as read"
 * button or the quiet completed state. Purely presentational — the host
 * owns the API call.
 */
@Component({
  selector: 'sh-reading-card',
  standalone: true,
  templateUrl: './reading-card.html',
  styleUrl: './reading-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingCard {
  readonly planName = input.required<string>();
  readonly dayNumber = input.required<number>();
  readonly passageReference = input.required<string>();
  /** YouVersion deep link for the passage. */
  readonly href = input.required<string>();
  /** Whether this day's reading was completed today. */
  readonly completed = input<boolean>(false);
  readonly completedCount = input<number>(0);
  readonly totalDays = input<number>(0);

  /** Emitted when the user marks the passage read. */
  readonly markRead = output<void>();
}
