import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_STORE } from 'api';

import { isOnboarded } from '../shared/onboarding';

/**
 * Gate every signed-in surface (`/today`, `/health`, `/people`, `/settings`).
 *
 * Anonymous FIRST-RUN visitors (`sh.onboarded` unset) are sent to the
 * `/welcome` flow, which ends at sign-in. Every other anonymous visitor
 * is bounced to `/sign-in` with `?returnUrl=<original>` so the sign-in
 * handler can drop them back where they started.
 *
 * The guard runs *after* `SessionStore.rehydrate()` completes — the App
 * shell holds the router outlet behind a loading curtain until then, so
 * `isAuthenticated()` is authoritative on first paint.
 */
export const requireAuth: CanActivateFn = (_route, state) => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);
  if (session.isAuthenticated()) return true;
  if (!isOnboarded()) return router.createUrlTree(['/welcome']);
  return router.createUrlTree(['/sign-in'], {
    queryParams: { returnUrl: state.url },
  });
};
