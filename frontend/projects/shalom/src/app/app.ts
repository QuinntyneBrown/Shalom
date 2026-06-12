import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { SESSION_STORE } from 'api';
import { BottomNav, BottomNavKey } from 'components';

import { OfflineBanner } from './pwa/offline-banner';
import { UpdateToast } from './pwa/update-toast';

/**
 * Application shell.
 *
 * Two body modes, picked up from the deepest active route's `data.shell`:
 *
 * - `undefined` (default) — wraps `<router-outlet>` in `.sh-frame`, the
 *   phone-canvas, and shows `sh-bottom-nav` for authenticated visitors.
 * - `'auth'` — body centers the sign-in card (`flex; column; align-items;
 *   justify-content: center; padding: 24px`). No `.sh-frame` wrapper.
 * - `'ritual'` — the phone canvas WITHOUT the bottom nav: the morning
 *   ritual is full-screen and undistracted (`.sh-frame--bare`).
 *
 * On bootstrap the SessionStore rehydrates from local/session storage; the
 * router outlet stays gated on `loading()` so guards see authoritative
 * state on the first paint.
 */

export type AppShell = 'auth' | 'ritual';

interface NavState {
  shell: AppShell | undefined;
  url: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNav, OfflineBanner, UpdateToast],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly session = inject(SESSION_STORE);

  private readonly nav = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((): NavState => ({
        shell: this.deepestRoute().snapshot.data['shell'] as AppShell | undefined,
        url: this.router.url,
      })),
      startWith<NavState>({ shell: undefined, url: this.router.url }),
    ),
    { initialValue: { shell: undefined, url: '/' } satisfies NavState },
  );

  protected readonly chrome = computed(() => !this.nav().shell);
  protected readonly ritual = computed(() => this.nav().shell === 'ritual');
  protected readonly loading = this.session.loading;
  protected readonly authenticated = this.session.isAuthenticated;

  protected readonly activeNav = computed<BottomNavKey>(() => {
    const url = this.nav().url;
    if (url.startsWith('/health')) return 'health';
    if (url.startsWith('/people')) return 'people';
    return 'today';
  });

  constructor() {
    effect(() => {
      const s = this.nav().shell;
      this.document.body.classList.toggle('sh-body--auth', s === 'auth');
    });
  }

  private deepestRoute(): ActivatedRoute {
    let r = this.activatedRoute;
    while (r.firstChild) r = r.firstChild;
    return r;
  }
}
