/*
 * Public API Surface of api
 *
 * Two kinds of exports live here:
 *
 *   1. CONTRACTS — interfaces + injection tokens (one pair per service).
 *      Pages and any future plugins should depend ONLY on these. They
 *      define WHAT a service does without committing to HOW.
 *
 *   2. IMPLEMENTATIONS — concrete classes that satisfy the contracts. The
 *      host application wires `{ provide: TOKEN, useExisting: ConcreteClass }`
 *      in its composition root; consumers never import the classes
 *      directly.
 *
 * Domain models live in `lib/models/` (one type per file). DTO shapes that
 * only exist on the wire stay private to their service file.
 */

export * from './lib/api/api-base-url';

// Auth models
export * from './lib/models/auth-error';
export * from './lib/models/auth-error-code';
export * from './lib/models/auth-token';
export * from './lib/models/forgot-password-request';
export * from './lib/models/login-request';
export * from './lib/models/reset-password-request';
export * from './lib/models/resend-verification-request';
export * from './lib/models/signup-request';
export * from './lib/models/user';
export * from './lib/models/verify-email-request';

// Faith models (Today / check-ins / reading)
export * from './lib/models/check-in-dto';
export * from './lib/models/upsert-check-in-request';
export * from './lib/models/verse-dto';
export * from './lib/models/reading-day-dto';
export * from './lib/models/reading-plan-dto';
export * from './lib/models/today-reading-dto';
export * from './lib/models/today-streaks-dto';
export * from './lib/models/today-dto';

// Health models (fasting / workouts / meals)
export * from './lib/models/fasting-session-dto';
export * from './lib/models/fasting-override-dto';
export * from './lib/models/today-window-dto';
export * from './lib/models/fasting-schedule-dto';
export * from './lib/models/current-fast-dto';
export * from './lib/models/start-fast-request';
export * from './lib/models/update-fasting-schedule-request';
export * from './lib/models/equipment-type';
export * from './lib/models/workout-dto';
export * from './lib/models/log-workout-request';
export * from './lib/models/meal-tag';
export * from './lib/models/meal-entry-dto';
export * from './lib/models/log-meal-request';
export * from './lib/models/today-fasting-dto';
export * from './lib/models/today-health-dto';

// People models (people / nudges / gratitude / important dates)
export * from './lib/models/person-dto';
export * from './lib/models/person-detail-dto';
export * from './lib/models/save-person-request';
export * from './lib/models/important-date-dto';
export * from './lib/models/add-important-date-request';
export * from './lib/models/connection-nudge-dto';
export * from './lib/models/prayer-focus-dto';
export * from './lib/models/upcoming-date-dto';
export * from './lib/models/today-people-dto';
export * from './lib/models/gratitude-entry-dto';
export * from './lib/models/add-gratitude-request';

// Service contracts (interface + InjectionToken)
export * from './lib/services/auth.service.contract';
export * from './lib/services/session-store.contract';
export * from './lib/services/today.service.contract';
export * from './lib/services/check-ins.service.contract';
export * from './lib/services/reading.service.contract';
export * from './lib/services/fasting.service.contract';
export * from './lib/services/workouts.service.contract';
export * from './lib/services/meals.service.contract';
export * from './lib/services/people.service.contract';
export * from './lib/services/gratitude.service.contract';

// Concrete implementations (imported only by composition roots)
export * from './lib/services/auth.service';
export * from './lib/services/session-store';
export * from './lib/services/today.service';
export * from './lib/services/check-ins.service';
export * from './lib/services/reading.service';
export * from './lib/services/fasting.service';
export * from './lib/services/workouts.service';
export * from './lib/services/meals.service';
export * from './lib/services/people.service';
export * from './lib/services/gratitude.service';
