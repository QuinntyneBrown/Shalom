import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';

/**
 * Fixed-bottom primary navigation for the three Shalom pillars.
 *
 * Uses real Angular route hrefs so copy-link, modifier-click, and direct
 * opens all resolve to production routes. Plain clicks are still intercepted
 * so navigation stays inside the SPA. Mobile-only for now — the tablet rail
 * / desktop sidebar land in a later milestone.
 */

export type BottomNavKey = 'today' | 'health' | 'people';

interface NavItem {
  key: BottomNavKey;
  label: string;
  icon: string;
  href: string;
  route: string;
}

const ITEMS: readonly NavItem[] = [
  { key: 'today',  label: 'Today',  icon: 'wb_twilight',   href: '/today',  route: '/today' },
  { key: 'health', label: 'Health', icon: 'monitor_heart', href: '/health', route: '/health' },
  { key: 'people', label: 'People', icon: 'diversity_1',   href: '/people', route: '/people' },
];

@Component({
  selector: 'sh-bottom-nav',
  standalone: true,
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.active]': 'active()',
  },
})
export class BottomNav {
  readonly active = input<BottomNavKey>('today');

  protected readonly items = ITEMS;

  private readonly router = inject(Router);

  protected onNavigate(event: MouseEvent, route: string): void {
    // Let modifier-clicks (Ctrl/Cmd/middle-click) keep their browser meaning;
    // intercept only the plain primary-button click for the SPA case.
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.router.navigateByUrl(route);
  }

  protected isActive(key: BottomNavKey): boolean {
    return this.active() === key;
  }
}
