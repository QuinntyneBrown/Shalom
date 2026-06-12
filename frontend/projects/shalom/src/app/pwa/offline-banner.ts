import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConnectivityService } from '../shared/connectivity';

/**
 * Thin top-of-screen banner while the device is offline (M7). Reads keep
 * working from the service-worker cache; writes are online-only, so the
 * copy promises catch-up, not magic.
 */
@Component({
  selector: 'app-offline-banner',
  standalone: true,
  template: `
    @if (!online()) {
      <div class="banner" data-testid="sh-offline-banner" role="status">
        <span class="material-symbols-rounded" aria-hidden="true">cloud_off</span>
        You're offline — Shalom will catch up when you're back.
      </div>
    }
  `,
  styleUrl: './offline-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineBanner {
  protected readonly online = inject(ConnectivityService).online;
}
