import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CurrentFastDto, FASTING_SERVICE, FastingOverrideDto } from 'api';
import { ProgressRing } from 'components';

import { ConfirmDialog, ConfirmData } from '../../dialogs/confirm.dialog';
import { SheetOpener } from '../../dialogs/sheet';
import {
  formatElapsed,
  formatStarted,
  formatWindowTime,
} from '../../shared/health-format';

const WEEKDAY_LABELS: Record<string, string> = {
  Sunday: 'Sunday',
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
};

/**
 * Fast detail (`/health/fasting`, design 11): the big live ring, started/
 * window lines, the grace-forward "End fast here" flow, and the read-only
 * schedule card (Mon–Sat default + per-weekday overrides; editing the
 * schedule ships in a later milestone).
 */
@Component({
  selector: 'app-fast-detail',
  standalone: true,
  imports: [ProgressRing, RouterLink],
  templateUrl: './fast-detail.page.html',
  styleUrl: './fast-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FastDetailPage implements OnInit, OnDestroy {
  private readonly fasting = inject(FASTING_SERVICE);
  private readonly sheets = inject(SheetOpener);

  protected readonly fast = signal<CurrentFastDto | null>(null);
  protected readonly ending = signal(false);

  /** 1s heartbeat for the live elapsed ring. */
  protected readonly now = signal(Date.now());
  private tick: ReturnType<typeof setInterval> | null = null;

  protected readonly current = computed(() => this.fast()?.current ?? null);

  protected readonly elapsedLabel = computed(() => {
    const current = this.current();
    return current ? formatElapsed(this.now() - Date.parse(current.startedAt)) : null;
  });

  protected readonly targetLine = computed(() => {
    const f = this.fast();
    if (!f) return '';
    return `of ${f.current?.targetHours ?? f.schedule.targetFastHours} hours`;
  });

  protected readonly progress = computed(() => {
    const current = this.current();
    if (!current) return 0;
    const targetMs = current.targetHours * 3_600_000;
    return targetMs > 0 ? (this.now() - Date.parse(current.startedAt)) / targetMs : 0;
  });

  protected readonly startedLine = computed(() => {
    const current = this.current();
    return current ? `Started ${formatStarted(current.startedAt, new Date(this.now()))}` : null;
  });

  protected readonly windowLine = computed(() => {
    const schedule = this.fast()?.schedule;
    if (!schedule) return '';
    const start = formatWindowTime(schedule.todayWindow.start);
    const end = formatWindowTime(schedule.todayWindow.end);
    return `Window opens ${start} · closes ${end}`;
  });

  protected readonly defaultWindow = computed(() => {
    const schedule = this.fast()?.schedule;
    if (!schedule) return '';
    return `${formatWindowTime(schedule.eatingWindowStart)} – ${formatWindowTime(schedule.eatingWindowEnd)}`;
  });

  /** "Mon – Sat" when only Sunday is overridden (the design's shape); generic otherwise. */
  protected readonly defaultLabel = computed(() => {
    const overrides = this.fast()?.schedule.overrides ?? [];
    if (overrides.length === 0) return 'Every day';
    if (overrides.length === 1 && overrides[0].dayOfWeek === 'Sunday') return 'Mon – Sat';
    return 'Default';
  });

  protected readonly overrides = computed(() => this.fast()?.schedule.overrides ?? []);

  protected readonly ratio = computed(() => {
    const schedule = this.fast()?.schedule;
    return schedule ? `${schedule.targetFastHours}:${24 - schedule.targetFastHours}` : '';
  });

  ngOnInit(): void {
    this.tick = setInterval(() => this.now.set(Date.now()), 1_000);
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.tick !== null) clearInterval(this.tick);
  }

  protected overrideLabel(o: FastingOverrideDto): string {
    return WEEKDAY_LABELS[o.dayOfWeek] ?? o.dayOfWeek;
  }

  protected overrideWindow(o: FastingOverrideDto): string {
    return `${formatWindowTime(o.eatingWindowStart)} – ${formatWindowTime(o.eatingWindowEnd)}`;
  }

  protected endFast(): void {
    if (!this.current() || this.ending()) return;

    const ref = this.sheets.open<boolean | undefined, ConfirmData>(ConfirmDialog, {
      title: 'End this fast?',
      message: 'Fast ends here. Tonight starts fresh.',
      confirmLabel: 'End fast',
      cancelLabel: 'Keep going',
    });
    ref.closed.subscribe((confirmed) => {
      if (confirmed) void this.doEnd();
    });
  }

  private async doEnd(): Promise<void> {
    this.ending.set(true);
    try {
      await this.fasting.end();
      await this.load();
    } finally {
      this.ending.set(false);
    }
  }

  private async load(): Promise<void> {
    this.fast.set(await this.fasting.getCurrent());
  }
}
