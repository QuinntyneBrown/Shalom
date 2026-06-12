import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import {
  CurrentFastDto,
  FASTING_SERVICE,
  FastingSessionDto,
  IFastingService,
} from 'api';
import { SheetOpener } from '../../dialogs/sheet';
import { FastDetailPage } from './fast-detail.page';

const HOUR = 3_600_000;

function fastStarted(hoursAgo: number): FastingSessionDto {
  return {
    id: 'fast-1',
    startedAt: new Date(Date.now() - hoursAgo * HOUR).toISOString(),
    targetHours: 16,
    endedAt: null,
    elapsedHours: hoursAgo,
    outcome: null,
  };
}

function currentFast(current: FastingSessionDto | null): CurrentFastDto {
  return {
    current,
    schedule: {
      eatingWindowStart: '12:00:00',
      eatingWindowEnd: '20:00:00',
      targetFastHours: 16,
      timeZoneId: 'America/Toronto',
      overrides: [
        { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
      ],
      todayWindow: { start: '11:00:00', end: '19:00:00' },
    },
  };
}

describe('FastDetailPage', () => {
  let fixture: ComponentFixture<FastDetailPage>;
  let fastingMock: IFastingService;
  let confirmResult: boolean | undefined;
  let openSheet: ReturnType<typeof vi.fn>;
  let state: CurrentFastDto;

  async function setup(current: FastingSessionDto | null): Promise<void> {
    state = currentFast(current);
    fastingMock = {
      getCurrent: vi.fn(async () => state),
      start: vi.fn(),
      end: vi.fn(async () => {
        const ended: FastingSessionDto = {
          ...state.current!,
          endedAt: new Date().toISOString(),
          outcome: 'EndedEarly',
        };
        state = { ...state, current: null };
        return ended;
      }),
      history: vi.fn(async () => []),
      updateSchedule: vi.fn(),
    } as unknown as IFastingService;
    openSheet = vi.fn(() => ({ closed: of(confirmResult) }));

    await TestBed.configureTestingModule({
      imports: [FastDetailPage],
      providers: [
        provideRouter([]),
        { provide: FASTING_SERVICE, useValue: fastingMock },
        { provide: SheetOpener, useValue: { open: openSheet } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FastDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function text(testid: string): string {
    return (
      fixture.nativeElement.querySelector(`[data-testid="${testid}"]`)?.textContent ?? ''
    ).trim();
  }

  it('renders the big ring with elapsed, target, started, and window lines', async () => {
    await setup(fastStarted(11.4));

    expect(text('sh-fast-elapsed')).toBe('11h 24m');
    expect(fixture.nativeElement.querySelector('.hero .target')?.textContent).toContain('of 16 hours');
    expect(text('sh-fast-started')).toMatch(/^Started /);
    expect(text('sh-fast-window')).toBe('Window opens 11:00 · closes 19:00');
    expect(fixture.nativeElement.querySelector('[data-testid="sh-fast-end"]')).not.toBeNull();
  });

  it('shows the schedule card with the Mon–Sat default and the Sunday override', async () => {
    await setup(null);

    expect(text('sh-schedule-default')).toContain('Mon – Sat');
    expect(text('sh-schedule-default')).toContain('12:00 – 20:00');
    expect(text('sh-schedule-sunday')).toContain('Sunday');
    expect(text('sh-schedule-sunday')).toContain('13:30 – 20:30');
    expect(fixture.nativeElement.textContent).toContain('part of the rhythm — not a break');
  });

  it('ending the fast asks the grace-forward confirmation and reloads as ended', async () => {
    confirmResult = true;
    await setup(fastStarted(11.4));

    (fixture.nativeElement.querySelector('[data-testid="sh-fast-end"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(openSheet.mock.calls[0][1]).toMatchObject({
      message: 'Fast ends here. Tonight starts fresh.',
    });
    expect(fastingMock.end).toHaveBeenCalledTimes(1);
    expect(text('sh-fast-none')).toBe('No fast running');
    expect(fixture.nativeElement.querySelector('[data-testid="sh-fast-end"]')).toBeNull();
  });

  it('cancelling the confirmation leaves the fast running', async () => {
    confirmResult = undefined;
    await setup(fastStarted(11.4));

    (fixture.nativeElement.querySelector('[data-testid="sh-fast-end"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fastingMock.end).not.toHaveBeenCalled();
    expect(text('sh-fast-elapsed')).toBe('11h 24m');
  });

  it('shows the no-fast state when nothing is running', async () => {
    await setup(null);

    expect(text('sh-fast-none')).toBe('No fast running');
    expect(fixture.nativeElement.querySelector('.hero .target')?.textContent).toContain(
      'Tonight starts fresh',
    );
    expect(fixture.nativeElement.querySelector('[data-testid="sh-fast-end"]')).toBeNull();
  });
});
