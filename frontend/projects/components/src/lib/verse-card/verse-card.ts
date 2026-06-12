import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Verse-of-the-day card. Scripture is set in the Fraunces display voice
 * (`--sh-font-display`); the YouVersion link is an outline pill that opens
 * in a new tab — the verse stays here, the chapter lives in YouVersion.
 */
@Component({
  selector: 'sh-verse-card',
  standalone: true,
  templateUrl: './verse-card.html',
  styleUrl: './verse-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerseCard {
  /** Verse text (World English Bible). */
  readonly text = input.required<string>();
  /** Human reference, e.g. "John 3:16". */
  readonly reference = input.required<string>();
  /** YouVersion deep link for the full chapter. */
  readonly href = input.required<string>();
}
