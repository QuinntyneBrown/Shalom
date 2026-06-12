import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import {
  FASTING_SERVICE,
  FastingScheduleDto,
  IFastingService,
  UpdateFastingScheduleRequest,
} from 'api';
import { FastingScheduleDialog } from './fasting-schedule.dialog';

const schedule: FastingScheduleDto = {
  eatingWindowStart: '12:00:00',
  eatingWindowEnd: '20:00:00',
  targetFastHours: 16,
  timeZoneId: 'America/Toronto',
  overrides: [
    { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
  ],
  todayWindow: { start: '12:00:00', end: '20:00:00' },
};

describe('FastingScheduleDialog', () => {
  let fixture: ComponentFixture<FastingScheduleDialog>;
  let updateCalls: UpdateFastingScheduleRequest[];
  let close: ReturnType<typeof vi.fn>;

  async function setup(data: FastingScheduleDto = schedule): Promise<void> {
    updateCalls = [];
    close = vi.fn();
    const fastingMock = {
      updateSchedule: async (req: UpdateFastingScheduleRequest) => {
        updateCalls.push(req);
        return {
          ...data,
          eatingWindowStart: req.windowStart,
          eatingWindowEnd: req.windowEnd,
          targetFastHours: req.targetFastHours,
          overrides: req.overrides,
        };
      },
    } as unknown as IFastingService;

    await TestBed.configureTestingModule({
      imports: [FastingScheduleDialog],
      providers: [
        { provide: FASTING_SERVICE, useValue: fastingMock },
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FastingScheduleDialog);
    fixture.detectChanges();
  }

  function el<T extends HTMLElement>(testid: string): T {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  it('prefills the window, target, and the Sunday override row', async () => {
    await setup();

    expect(el<HTMLInputElement>('sh-sheet-schedule-start').value).toBe('12:00');
    expect(el<HTMLInputElement>('sh-sheet-schedule-end').value).toBe('20:00');
    expect(el('sh-sheet-schedule-target').textContent).toBe('16h');
    expect(el('sh-sheet-schedule-sunday-toggle').getAttribute('aria-checked')).toBe('true');
    expect(el<HTMLInputElement>('sh-sheet-schedule-sunday-start').value).toBe('13:30');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Sunday lunch after church is part of the rhythm',
    );
  });

  it('steps the fast target within 12–23 hours', async () => {
    await setup();

    for (let i = 0; i < 10; i++) el('sh-sheet-schedule-target-plus').click();
    fixture.detectChanges();
    expect(el('sh-sheet-schedule-target').textContent).toBe('23h');

    for (let i = 0; i < 20; i++) el('sh-sheet-schedule-target-minus').click();
    fixture.detectChanges();
    expect(el('sh-sheet-schedule-target').textContent).toBe('12h');
  });

  it('saves the edited schedule wholesale and closes with the server result', async () => {
    await setup();

    el<HTMLInputElement>('sh-sheet-schedule-start').value = '11:00';
    el<HTMLInputElement>('sh-sheet-schedule-start').dispatchEvent(new Event('input'));
    el<HTMLInputElement>('sh-sheet-schedule-end').value = '19:00';
    el<HTMLInputElement>('sh-sheet-schedule-end').dispatchEvent(new Event('input'));
    fixture.detectChanges();

    el('sh-sheet-save-schedule').click();
    await fixture.whenStable();

    expect(updateCalls).toEqual([
      {
        windowStart: '11:00:00',
        windowEnd: '19:00:00',
        targetFastHours: 16,
        overrides: [
          { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
        ],
      },
    ]);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('toggling Sunday off drops the override from the save payload', async () => {
    await setup();

    el('sh-sheet-schedule-sunday-toggle').click();
    fixture.detectChanges();

    el('sh-sheet-save-schedule').click();
    await fixture.whenStable();

    expect(updateCalls[0].overrides).toEqual([]);
  });

  it('refuses an inverted window', async () => {
    await setup();

    el<HTMLInputElement>('sh-sheet-schedule-start').value = '21:00';
    el<HTMLInputElement>('sh-sheet-schedule-start').dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el<HTMLButtonElement>('sh-sheet-save-schedule').disabled).toBe(true);
  });
});
