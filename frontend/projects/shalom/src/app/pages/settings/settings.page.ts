import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { FASTING_SERVICE, FastingScheduleDto, SESSION_STORE } from 'api';

import { FastingScheduleDialog } from '../../dialogs/fasting-schedule.dialog';
import { SheetOpener } from '../../dialogs/sheet';
import { formatWindowTime } from '../../shared/health-format';
import { TodayStore } from '../../state/today.store';
import { ThemePreference, ThemeService } from '../../theme/theme.service';

/**
 * Settings (design 19): grouped rows — RHYTHM (wake time display-only,
 * fasting schedule → editor sheet, quiet days), FAITH (reading plan,
 * YouVersion), REMINDERS (display-only until M10), APPEARANCE (theme
 * override auto/light/dawn), SHALOM (everything + about), sign out.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  private readonly session = inject(SESSION_STORE);
  private readonly fasting = inject(FASTING_SERVICE);
  private readonly sheets = inject(SheetOpener);
  private readonly router = inject(Router);
  private readonly store = inject(TodayStore);
  protected readonly theme = inject(ThemeService);

  protected readonly schedule = signal<FastingScheduleDto | null>(null);
  protected readonly themeOptions: readonly ThemePreference[] = ['auto', 'light', 'dawn'];

  /** "16:8" from the live schedule (design value position). */
  protected readonly scheduleValue = computed(() => {
    const schedule = this.schedule();
    return schedule ? `${schedule.targetFastHours}:${24 - schedule.targetFastHours}` : '16:8';
  });

  protected readonly scheduleWindow = computed(() => {
    const schedule = this.schedule();
    if (!schedule) return '';
    return `${formatWindowTime(schedule.eatingWindowStart)} – ${formatWindowTime(schedule.eatingWindowEnd)}`;
  });

  protected readonly readingPlanName = computed(
    () => this.store.reading()?.planName ?? 'John & His Letters',
  );

  ngOnInit(): void {
    void this.store.ensureLoaded().catch(() => undefined);
    void this.loadSchedule();
  }

  private async loadSchedule(): Promise<void> {
    try {
      const current = await this.fasting.getCurrent();
      this.schedule.set(current.schedule);
    } catch {
      // The row falls back to the design default value.
    }
  }

  protected openScheduleEditor(): void {
    const schedule = this.schedule();
    if (!schedule) return;
    const ref = this.sheets.open<FastingScheduleDto | undefined, FastingScheduleDto>(
      FastingScheduleDialog,
      schedule,
    );
    ref.closed.subscribe((updated) => {
      if (updated) this.schedule.set(updated);
    });
  }

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }

  protected signOut(): void {
    this.session.logout();
    void this.router.navigateByUrl('/sign-in');
  }
}
