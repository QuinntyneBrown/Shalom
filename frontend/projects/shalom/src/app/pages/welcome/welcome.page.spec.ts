import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import {
  CurrentFastDto,
  FASTING_SERVICE,
  FastingScheduleDto,
  IFastingService,
  ISessionStore,
  SESSION_STORE,
  UpdateFastingScheduleRequest,
} from 'api';

import { SheetOpener } from '../../dialogs/sheet';
import { WelcomePage } from './welcome.page';

const schedule: FastingScheduleDto = {
  eatingWindowStart: '11:30:00',
  eatingWindowEnd: '19:30:00',
  targetFastHours: 16,
  timeZoneId: 'America/Toronto',
  overrides: [
    { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
  ],
  todayWindow: { start: '11:30:00', end: '19:30:00' },
};

describe('WelcomePage', () => {
  let fixture: ComponentFixture<WelcomePage>;
  let router: Router;
  let updateCalls: UpdateFastingScheduleRequest[];
  let openSheet: ReturnType<typeof vi.fn>;
  let sheetClosed: Subject<unknown>;

  async function setup(options: { authenticated?: boolean } = {}): Promise<void> {
    updateCalls = [];
    sheetClosed = new Subject<unknown>();
    openSheet = vi.fn(() => ({ closed: sheetClosed.asObservable() }));

    const fastingMock = {
      getCurrent: async (): Promise<CurrentFastDto> => ({ current: null, schedule }),
      updateSchedule: async (req: UpdateFastingScheduleRequest) => {
        updateCalls.push(req);
        return schedule;
      },
    } as unknown as IFastingService;

    await TestBed.configureTestingModule({
      imports: [WelcomePage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: SESSION_STORE,
          useValue: {
            isAuthenticated: signal(options.authenticated ?? false),
          } as unknown as ISessionStore,
        },
        { provide: FASTING_SERVICE, useValue: fastingMock },
        { provide: SheetOpener, useValue: { open: openSheet } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(WelcomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId<T extends HTMLElement>(id: string): T | null {
    return el().querySelector<T>(`[data-testid="${id}"]`);
  }

  function continueTo(step: 2 | 3): void {
    for (let i = 1; i < step; i++) {
      byTestId<HTMLButtonElement>('sh-welcome-continue')!.click();
      fixture.detectChanges();
    }
  }

  it('walks the three steps with the dots tracking progress', async () => {
    await setup();

    expect(byTestId('sh-welcome-step-1')!.textContent).toContain('Shalom.');
    expect(byTestId('sh-welcome-step-1')!.textContent).toContain(
      'Wholeness, one morning at a time.',
    );
    expect(byTestId('sh-welcome-step-1')!.textContent).toContain('A 2-minute morning ritual');
    expect(byTestId('sh-welcome-step-1')!.textContent).toContain('Fasting that fits your real life');
    expect(byTestId('sh-welcome-step-1')!.textContent).toContain(
      'Stay close to the people you love',
    );
    expect(el().querySelectorAll('.dot').length).toBe(3);
    expect(el().querySelectorAll('.dot')[0].classList).toContain('active');

    continueTo(2);
    expect(byTestId('sh-welcome-step-2')!.textContent).toContain('Your rhythm');
    expect(byTestId('sh-welcome-wake-value')!.textContent).toContain('6:00 AM');
    expect(byTestId('sh-welcome-window-value')!.textContent).toContain('12:00 PM – 8:00 PM');
    expect(el().querySelectorAll('.dot')[1].classList).toContain('active');

    continueTo(2); // 2 → 3
    expect(byTestId('sh-welcome-step-3')!.textContent).toContain('Make it yours');
    expect(byTestId('sh-welcome-finish')!.textContent).toContain('Begin tomorrow morning');
    expect(byTestId('sh-welcome-start-now')!.textContent).toContain('or start right now');
  });

  it('finishing signed-out persists sh.onboarded and lands on sign-in (no PUT)', async () => {
    await setup();
    continueTo(3);

    byTestId<HTMLButtonElement>('sh-welcome-finish')!.click();
    await fixture.whenStable();

    expect(localStorage.getItem('sh.onboarded')).toBe('1');
    expect(updateCalls.length).toBe(0);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sign-in');
  });

  it('signed-in quick setup starts at step 2, pre-fills the live schedule, and PUTs on finish', async () => {
    await setup({ authenticated: true });

    // sh.onboarded unset + signed in ⇒ steps 2–3 only.
    expect(byTestId('sh-welcome-step-1')).toBeNull();
    expect(byTestId('sh-welcome-step-2')).not.toBeNull();
    expect(byTestId('sh-welcome-window-value')!.textContent).toContain('11:30 AM – 7:30 PM');

    continueTo(2); // 2 → 3
    byTestId<HTMLButtonElement>('sh-welcome-finish')!.click();
    await fixture.whenStable();

    expect(updateCalls).toEqual([
      {
        windowStart: '11:30:00',
        windowEnd: '19:30:00',
        targetFastHours: 16,
        overrides: [
          { dayOfWeek: 'Sunday', eatingWindowStart: '13:30:00', eatingWindowEnd: '20:30:00' },
        ],
      },
    ]);
    expect(localStorage.getItem('sh.onboarded')).toBe('1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/today');
  });

  it('the Sunday toggle drops the override from the PUT when switched off', async () => {
    await setup({ authenticated: true });

    byTestId<HTMLButtonElement>('sh-welcome-sunday-toggle')!.click();
    fixture.detectChanges();

    continueTo(2);
    byTestId<HTMLButtonElement>('sh-welcome-start-now')!.click();
    await fixture.whenStable();

    expect(updateCalls[0].overrides).toEqual([]);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/today/ritual');
  });

  it('replay (sh.onboarded already set) starts at step 1 even when signed in', async () => {
    localStorage.setItem('sh.onboarded', '1');
    await setup({ authenticated: true });

    expect(byTestId('sh-welcome-step-1')).not.toBeNull();
  });

  it('the wake-time sheet persists sh.wakeTime and updates the display', async () => {
    await setup();
    continueTo(2);

    byTestId<HTMLButtonElement>('sh-welcome-wake-change')!.click();
    expect(openSheet).toHaveBeenCalledTimes(1);

    sheetClosed.next('05:30');
    fixture.detectChanges();

    expect(localStorage.getItem('sh.wakeTime')).toBe('05:30');
    expect(byTestId('sh-welcome-wake-value')!.textContent).toContain('5:30 AM');
  });

  it('step 3 shows the Add-to-Home-Screen steps in a browser tab', async () => {
    await setup();
    continueTo(3);

    expect(byTestId('sh-welcome-a2hs')!.textContent).toContain('Add to Home Screen');
    expect(byTestId('sh-welcome-a2hs')!.textContent).toContain('Tap the Share button in Safari');
    expect(byTestId('sh-welcome-installed')).toBeNull();
  });

  it('step 3 shows "You\'re all set" when already running standalone', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    );
    await setup();
    continueTo(3);

    expect(byTestId('sh-welcome-installed')!.textContent).toContain("You're all set");
  });

  it('"Show me how" reveals the Shortcuts automation note', async () => {
    await setup();
    continueTo(3);

    expect(byTestId('sh-welcome-shortcuts-note')).toBeNull();
    byTestId<HTMLButtonElement>('sh-welcome-shortcuts-how')!.click();
    fixture.detectChanges();

    const note = byTestId('sh-welcome-shortcuts-note')!;
    expect(note.textContent).toContain('When my alarm is stopped');
    expect(note.querySelector('a')!.getAttribute('href')).toBe('shortcuts://');
  });
});
