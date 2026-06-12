import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * "Everything Shalom can do" (design 20) — the quiet feature map behind
 * Settings. Three pillar groups; not-yet-built rows wear a "soon" pill
 * (progressive disclosure surfaces features over time, never locks them).
 */

interface EverythingRow {
  readonly icon: string;
  readonly title: string;
  readonly sub: string;
  readonly pill: string | null;
}

interface EverythingGroup {
  readonly label: string;
  readonly rows: readonly EverythingRow[];
}

const GROUPS: readonly EverythingGroup[] = [
  {
    label: 'Mornings',
    rows: [
      { icon: 'wb_twilight', title: 'Morning ritual', sub: 'Check-in, scripture, prayer — 2 minutes', pill: null },
      { icon: 'menu_book', title: 'Reading plan', sub: 'John & His Letters, a chapter a day', pill: null },
      { icon: 'history', title: 'Check-in history', sub: 'How your soul has been', pill: 'soon' },
    ],
  },
  {
    label: 'Health',
    rows: [
      { icon: 'timer', title: 'Fasting', sub: '16:8 with Sunday grace', pill: null },
      { icon: 'fitness_center', title: 'Workouts', sub: 'Treadmill, bike, elliptical, outdoor walks & runs', pill: null },
      { icon: 'restaurant', title: 'Meal notes', sub: 'Patterns, not calories', pill: null },
      { icon: 'monitoring', title: 'Trends', sub: 'What helps, gently', pill: 'week 3' },
    ],
  },
  {
    label: 'People',
    rows: [
      { icon: 'favorite', title: 'Daily nudge', sub: 'One person, once a day', pill: null },
      { icon: 'cake', title: 'Important dates', sub: 'Surfaced a week early', pill: null },
      { icon: 'volunteer_activism', title: 'Gratitude notes', sub: 'Private by default', pill: null },
    ],
  },
];

@Component({
  selector: 'app-everything',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './everything.page.html',
  styleUrl: './everything.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EverythingPage {
  protected readonly groups = GROUPS;
}
