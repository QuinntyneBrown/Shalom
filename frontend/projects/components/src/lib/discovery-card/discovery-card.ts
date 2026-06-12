import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * The Discovery card — progressive disclosure's one quiet voice (CLAUDE.md:
 * one card at a time, never two days in a row, dismiss = snooze, never a
 * lock). Sand-tinted so it reads as an aside, not a task. The host decides
 * WHAT to surface (the discovery engine); this component only renders it.
 */
@Component({
  selector: 'sh-discovery-card',
  standalone: true,
  templateUrl: './discovery-card.html',
  styleUrl: './discovery-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoveryCard {
  /** Material Symbols Rounded ligature, e.g. `lightbulb`. */
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  /** CTA label; omit for announce-only or soon-teaser cards. */
  readonly ctaLabel = input<string | null>(null);
  /** Shows the quiet "soon" pill for teasers that link nowhere yet. */
  readonly soon = input(false);

  /** CTA tapped — the host navigates and retires the card. */
  readonly cta = output<void>();
  /** X tapped — the host snoozes the card for seven days. */
  readonly dismissed = output<void>();
}
