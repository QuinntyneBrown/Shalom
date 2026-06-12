import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Card shell for pillar content (Today / Health / People surfaces).
 *
 * Optional Material Symbols icon, title (rendered in the Fraunces display
 * voice), subtitle, and projected body content. Deliberately minimal — the
 * full design lands later from the .pen file.
 */
@Component({
  selector: 'sh-pillar-card',
  standalone: true,
  templateUrl: './pillar-card.html',
  styleUrl: './pillar-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillarCard {
  /** Material Symbols Rounded ligature name, e.g. `wb_twilight`. */
  readonly icon = input<string>();
  readonly title = input<string>();
  readonly subtitle = input<string>();
}
