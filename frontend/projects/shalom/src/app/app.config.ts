import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth/auth.interceptor';

import {
  API_BASE_URL,
  AUTH_SERVICE,
  AuthService,
  CHECK_INS_SERVICE,
  CheckInsService,
  FASTING_SERVICE,
  FastingService,
  GRATITUDE_SERVICE,
  GratitudeService,
  MEALS_SERVICE,
  MealsService,
  PEOPLE_SERVICE,
  PeopleService,
  READING_SERVICE,
  ReadingService,
  SESSION_STORE,
  SessionStore,
  TODAY_SERVICE,
  TodayService,
  WORKOUTS_SERVICE,
  WorkoutsService,
} from 'api';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(SESSION_STORE).rehydrate()),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },

    // Composition root: pages depend on tokens; the production host binds
    // each token to its real implementation. Swap any of these to a mock at
    // test time without touching page code.
    //
    // Auth — bound to the real HTTP `AuthService`. `SessionStore` owns the
    // persistence + error-mapping; pages depend only on `SESSION_STORE`.
    { provide: AUTH_SERVICE, useExisting: AuthService },
    { provide: SESSION_STORE, useExisting: SessionStore },

    // Faith slice — Today aggregate, check-ins, reading plan.
    { provide: TODAY_SERVICE, useExisting: TodayService },
    { provide: CHECK_INS_SERVICE, useExisting: CheckInsService },
    { provide: READING_SERVICE, useExisting: ReadingService },

    // Health slice — fasting, workouts, meals.
    { provide: FASTING_SERVICE, useExisting: FastingService },
    { provide: WORKOUTS_SERVICE, useExisting: WorkoutsService },
    { provide: MEALS_SERVICE, useExisting: MealsService },

    // People slice — circle, derived nudges, gratitude, important dates.
    { provide: PEOPLE_SERVICE, useExisting: PeopleService },
    { provide: GRATITUDE_SERVICE, useExisting: GratitudeService },
  ],
};
