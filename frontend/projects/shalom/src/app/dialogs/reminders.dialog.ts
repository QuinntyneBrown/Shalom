import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { PushReminders } from '../pwa/push-reminders';

/**
 * The "Nudges" bottom sheet (M10, Settings → REMINDERS): explains the only
 * 2–3 moments Shalom will ever tap a shoulder for, with one calm switch.
 * Both the enable tap here and the discovery card run the same
 * `PushReminders.enable()` flow — a user gesture either way (iOS requires
 * it). Denied is met with grace, never a nag: the app works just as well
 * without taps on the shoulder.
 */
@Component({
  selector: 'app-reminders-dialog',
  standalone: true,
  templateUrl: './reminders.dialog.html',
  styleUrl: './reminders.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemindersDialog {
  private readonly ref = inject<DialogRef<void>>(DialogRef);
  protected readonly push = inject(PushReminders);

  protected readonly busy = signal(false);
  /** Set when an enable attempt just came back denied — show the calm line. */
  protected readonly justDenied = signal(false);

  protected async turnOn(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const state = await this.push.enable();
      this.justDenied.set(state === 'denied');
    } finally {
      this.busy.set(false);
    }
  }

  protected async turnOff(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.push.disable();
    } finally {
      this.busy.set(false);
    }
  }

  protected close(): void {
    this.ref.close();
  }
}
