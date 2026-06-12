import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { DEFAULT_WAKE_TIME } from '../shared/onboarding';

/**
 * "I usually wake at" bottom sheet (welcome step 2). Device-local only —
 * closes with the chosen `HH:mm`; the caller persists `sh.wakeTime`.
 * No backend: wake time is display-only everywhere else.
 */
@Component({
  selector: 'app-wake-time-dialog',
  standalone: true,
  templateUrl: './wake-time.dialog.html',
  styleUrl: './wake-time.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WakeTimeDialog {
  private readonly ref = inject<DialogRef<string | undefined>>(DialogRef);
  private readonly initial = inject<string>(DIALOG_DATA, { optional: true }) ?? DEFAULT_WAKE_TIME;

  protected readonly time = signal(this.initial);

  protected onTimeInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.time.set(value);
  }

  protected save(): void {
    this.ref.close(this.time());
  }
}
