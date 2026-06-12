import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SESSION_STORE } from 'api';

/**
 * Keep signed-in users off the sign-in surface — they land on `/today`
 * instead. Mirrors `requireAuth` in the other direction.
 */
export const requireAnonymous: CanActivateFn = () => {
  const session = inject(SESSION_STORE);
  const router = inject(Router);
  if (!session.isAuthenticated()) return true;
  return router.createUrlTree(['/today']);
};
