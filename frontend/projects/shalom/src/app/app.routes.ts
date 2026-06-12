import { Routes } from '@angular/router';

import { requireAnonymous } from './auth/require-anonymous.guard';
import { requireAuth } from './auth/require-auth.guard';

/**
 * Shalom application routes.
 *
 * - `/` redirects to `/today`, the default pillar.
 * - `/sign-in` and `/welcome` are the public surfaces; signed-in visitors
 *   to `/sign-in` are bounced back to `/today` by `requireAnonymous`.
 * - `/welcome` (designs 16–18) carries NO guard: first-run visitors land
 *   here before sign-in (`requireAuth` sends them when `sh.onboarded` is
 *   unset), the first sign-in returns here for the quick setup, and
 *   Settings can replay it any time. It runs in the nav-less `'ritual'`
 *   shell.
 * - The app surfaces (`/today`, `/today/ritual`, `/health`,
 *   `/health/fasting`, `/people`, `/people/:id`, `/settings`,
 *   `/settings/everything`) are all guarded by `requireAuth`; the ritual
 *   runs in the nav-less `'ritual'` shell.
 * - `**` lands on the not-found page.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'today',
  },
  {
    path: 'sign-in',
    data: { shell: 'auth' },
    canActivate: [requireAnonymous],
    loadComponent: () =>
      import('./pages/sign-in/sign-in.page').then((m) => m.SignInPage),
  },
  {
    path: 'welcome',
    data: { shell: 'ritual' },
    loadComponent: () =>
      import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'today',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/today/today.page').then((m) => m.TodayPage),
  },
  {
    path: 'today/ritual',
    data: { shell: 'ritual' },
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/ritual/ritual.page').then((m) => m.RitualPage),
  },
  {
    path: 'health',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/health/health.page').then((m) => m.HealthPage),
  },
  {
    path: 'health/fasting',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/fast-detail/fast-detail.page').then((m) => m.FastDetailPage),
  },
  {
    path: 'people',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/people/people.page').then((m) => m.PeoplePage),
  },
  {
    path: 'people/:id',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/person-detail/person-detail.page').then((m) => m.PersonDetailPage),
  },
  {
    path: 'settings',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'settings/everything',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./pages/everything/everything.page').then((m) => m.EverythingPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
