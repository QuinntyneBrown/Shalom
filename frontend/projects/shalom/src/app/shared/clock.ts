/**
 * The single device-time source for the time-aware surfaces (Today bands,
 * dawn theme, ritual). Everything that asks "what time is it?" goes through
 * `appNow()` so e2e specs can pin the clock deterministically:
 *
 *   - `window.__shTestNow` (an ISO date-time string) is honored ONLY when
 *     `localStorage['sh.testMode'] === '1'` — both are injected by the
 *     Playwright fixtures via `addInitScript`; production traffic never
 *     trips it.
 */

declare global {
  interface Window {
    __shTestNow?: string;
  }
}

export function appNow(): Date {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('sh.testMode') === '1' &&
      window.__shTestNow
    ) {
      const pinned = new Date(window.__shTestNow);
      if (!Number.isNaN(pinned.getTime())) return pinned;
    }
  } catch {
    // Storage access can throw (private mode); real time is always safe.
  }
  return new Date();
}
