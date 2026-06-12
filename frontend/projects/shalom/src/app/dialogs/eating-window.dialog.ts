import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

/** `HH:mm` pair for the welcome flow's eating window. */
export interface EatingWindowValue {
  start: string;
  end: string;
}

/**
 * Eating-window bottom sheet for the welcome flow (step 2). Local-only by
 * design: pre-auth there is nothing to PUT, and post-auth the welcome page
 * applies the whole rhythm once via PUT /api/fasting/schedule on finish —
 * so this sheet just returns the chosen pair. (Settings keeps using the
 * full FastingScheduleDialog, which saves immediately.)
 */
@Component({
  selector: 'app-eating-window-dialog',
  standalone: true,
  templateUrl: './eating-window.dialog.html',
  styleUrl: './eating-window.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EatingWindowDialog {
  private readonly ref = inject<DialogRef<EatingWindowValue | undefined>>(DialogRef);
  private readonly data = inject<EatingWindowValue>(DIALOG_DATA, { optional: true }) ?? {
    start: '12:00',
    end: '20:00',
  };

  protected readonly start = signal(this.data.start);
  protected readonly end = signal(this.data.end);

  protected readonly canSave = computed(() => this.start() < this.end());

  protected onTimeInput(target: 'start' | 'end', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this[target].set(value);
  }

  protected save(): void {
    if (!this.canSave()) return;
    this.ref.close({ start: this.start(), end: this.end() });
  }
}
