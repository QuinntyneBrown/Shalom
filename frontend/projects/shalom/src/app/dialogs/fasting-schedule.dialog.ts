import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FASTING_SERVICE, FastingOverrideDto, FastingScheduleDto } from 'api';

/**
 * "Fasting schedule" bottom sheet (Settings → RHYTHM): the weekday eating
 * window, the fast target, and the Sunday override as a first-class row
 * (ADR-005: Sunday family lunch is part of the rhythm, not a streak-breaker).
 * Saves wholesale via PUT /api/fasting/schedule; other-day overrides (none
 * exist today) are preserved untouched.
 */
@Component({
  selector: 'app-fasting-schedule-dialog',
  standalone: true,
  templateUrl: './fasting-schedule.dialog.html',
  styleUrl: './fasting-schedule.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FastingScheduleDialog {
  private readonly fasting = inject(FASTING_SERVICE);
  private readonly ref = inject<DialogRef<FastingScheduleDto | undefined>>(DialogRef);
  private readonly data = inject<FastingScheduleDto>(DIALOG_DATA);

  private readonly sunday = this.data.overrides.find((o) => o.dayOfWeek === 'Sunday') ?? null;
  private readonly otherOverrides = this.data.overrides.filter((o) => o.dayOfWeek !== 'Sunday');

  protected readonly windowStart = signal(this.data.eatingWindowStart.slice(0, 5));
  protected readonly windowEnd = signal(this.data.eatingWindowEnd.slice(0, 5));
  protected readonly targetHours = signal(this.data.targetFastHours);
  protected readonly sundayEnabled = signal(this.sunday !== null);
  protected readonly sundayStart = signal((this.sunday?.eatingWindowStart ?? '13:30:00').slice(0, 5));
  protected readonly sundayEnd = signal((this.sunday?.eatingWindowEnd ?? '20:30:00').slice(0, 5));
  protected readonly saving = signal(false);

  protected readonly ratio = computed(() => `${this.targetHours()}:${24 - this.targetHours()}`);

  protected readonly canSave = computed(
    () =>
      !this.saving() &&
      this.windowStart() < this.windowEnd() &&
      (!this.sundayEnabled() || this.sundayStart() < this.sundayEnd()),
  );

  protected stepTarget(delta: number): void {
    this.targetHours.update((hours) => Math.min(23, Math.max(12, hours + delta)));
  }

  protected toggleSunday(): void {
    this.sundayEnabled.update((enabled) => !enabled);
  }

  protected onTimeInput(target: 'windowStart' | 'windowEnd' | 'sundayStart' | 'sundayEnd', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this[target].set(value);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    try {
      const overrides: FastingOverrideDto[] = [...this.otherOverrides];
      if (this.sundayEnabled()) {
        overrides.push({
          dayOfWeek: 'Sunday',
          eatingWindowStart: `${this.sundayStart()}:00`,
          eatingWindowEnd: `${this.sundayEnd()}:00`,
        });
      }
      const saved = await this.fasting.updateSchedule({
        windowStart: `${this.windowStart()}:00`,
        windowEnd: `${this.windowEnd()}:00`,
        targetFastHours: this.targetHours(),
        overrides,
      });
      this.ref.close(saved);
    } finally {
      this.saving.set(false);
    }
  }
}
