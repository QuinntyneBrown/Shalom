import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/**
 * "A quieter, newer Shalom is ready — refresh." (M7)
 *
 * iOS service workers are sticky: an installed PWA can keep serving the old
 * bundle for days. This calm toast is the escape hatch — it appears on
 * `VERSION_READY`, sits at the bottom above the nav, and a tap activates
 * the update and reloads. Dismissable; never blocks anything.
 *
 * `SwUpdate` is optional so the component is inert in TestBeds (and any
 * context) without `provideServiceWorker`; when the worker is disabled
 * (dev mode) `versionUpdates` simply never emits.
 */
@Component({
  selector: 'app-update-toast',
  standalone: true,
  templateUrl: './update-toast.html',
  styleUrl: './update-toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateToast {
  private readonly updates = inject(SwUpdate, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  protected readonly ready = signal(false);
  protected readonly refreshing = signal(false);

  constructor() {
    this.updates?.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.ready.set(true));
  }

  protected async refresh(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    try {
      await this.updates?.activateUpdate();
    } catch {
      // Activation can race a background update; reloading is still right.
    }
    this.reload();
  }

  protected dismiss(): void {
    this.ready.set(false);
  }

  /** Seam for tests — `location.reload()` would tear the runner down. */
  protected reload(): void {
    location.reload();
  }
}
