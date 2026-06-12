import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import {
  ConnectionNudgeDto,
  IPeopleService,
  ITodayService,
  PEOPLE_SERVICE,
  PersonDto,
  TODAY_SERVICE,
  TodayDto,
} from 'api';
import { SheetOpener } from '../../dialogs/sheet';
import { PeoplePage } from './people.page';

const TODAY = '2026-06-12';

function person(overrides: Partial<PersonDto>): PersonDto {
  return {
    id: 'p-x',
    name: 'Someone',
    relationship: null,
    phone: null,
    contactCadenceDays: null,
    notes: null,
    lastContactedOn: null,
    snoozedUntil: null,
    ...overrides,
  };
}

const natalie = person({
  id: 'p-1',
  name: 'Natalie',
  relationship: 'Wife',
  phone: '+1 416 555 0100',
  contactCadenceDays: 2,
  lastContactedOn: TODAY,
});
const marcus = person({
  id: 'p-2',
  name: 'Marcus',
  relationship: 'Friend',
  contactCadenceDays: 14,
  lastContactedOn: '2026-05-29',
});

const nudge: ConnectionNudgeDto = {
  personId: 'p-2',
  name: 'Marcus',
  relationship: 'Friend',
  prompt: 'Send Marcus a quick text — no reason needed.',
  phone: null,
};

function todayDto(nudgeValue: ConnectionNudgeDto | null): TodayDto {
  return {
    date: TODAY,
    greetingName: 'quinntynebrown',
    checkIn: null,
    verse: { reference: 'John 3:16', text: 'For God so loved…', youVersionUrl: 'https://x' },
    reading: null,
    streaks: {
      checkInCurrent: 0, checkInLongest: 0, readingCurrent: 0, readingLongest: 0,
      fastingCurrent: 0, fastingLongest: 0, movementCurrent: 0, movementLongest: 0,
    },
    fasting: {
      current: null,
      todayWindow: { start: '12:00:00', end: '20:00:00' },
      windowOpen: false,
      targetHours: 16,
    },
    health: { todaysWorkouts: [], lastMeal: null },
    people: { nudge: nudgeValue, upcomingDates: [] },
  };
}

describe('PeoplePage', () => {
  let fixture: ComponentFixture<PeoplePage>;
  let peopleMock: IPeopleService;
  let todayMock: ITodayService;
  let openSheet: ReturnType<typeof vi.fn>;
  let sheetResult: unknown;
  let currentNudge: ConnectionNudgeDto | null;

  async function setup(options?: {
    people?: PersonDto[];
    nudge?: ConnectionNudgeDto | null;
  }): Promise<void> {
    currentNudge = options?.nudge ?? null;
    peopleMock = {
      list: vi.fn(async () => options?.people ?? []),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      recordContact: vi.fn(async () => {
        currentNudge = null; // server suppresses after any contact today
        return natalie;
      }),
      snooze: vi.fn(async () => {
        currentNudge = null;
        return marcus;
      }),
      nudges: vi.fn(async () => []),
      addDate: vi.fn(),
      removeDate: vi.fn(),
    } as unknown as IPeopleService;
    todayMock = { getToday: async () => todayDto(currentNudge) };
    openSheet = vi.fn(() => ({ closed: of(sheetResult) }));

    await TestBed.configureTestingModule({
      imports: [PeoplePage],
      providers: [
        provideRouter([]),
        { provide: PEOPLE_SERVICE, useValue: peopleMock },
        { provide: TODAY_SERVICE, useValue: todayMock },
        { provide: SheetOpener, useValue: { open: openSheet } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PeoplePage);
    fixture.detectChanges();
    await settle();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();
  }

  function el(testid: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  it('renders the header, the tagline, and the people rows ordered by the API', async () => {
    await setup({ people: [marcus, natalie] });
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('h1')?.textContent).toBe('People');
    expect(host.textContent).toContain('the ones God gave you');

    const rows = host.querySelectorAll('[data-testid="sh-person-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Marcus');
    expect(rows[1].textContent).toContain('Natalie');
  });

  it('captions rows with relationship and last contact, gold dot only for connected-today', async () => {
    await setup({ people: [marcus, natalie] });
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="sh-person-row"]');

    expect(rows[0].textContent).toContain('Friend · 14 days ago');
    expect(rows[0].querySelector('.gold-dot')).toBeNull();
    expect(rows[1].textContent).toContain('Wife · connected today');
    expect(rows[1].querySelector('.gold-dot')).not.toBeNull();
  });

  it('shows the nudge card with the server prompt and no Text action without a phone', async () => {
    await setup({ people: [marcus], nudge });

    expect(el('sh-nudge-card')).not.toBeNull();
    expect(el('sh-nudge-prompt')?.textContent?.trim()).toBe(nudge.prompt);
    expect(el('sh-nudge-text')).toBeNull();
    expect(el('sh-nudge-call')).toBeNull();
  });

  it('renders Text and Call hrefs when the nudgee has a phone', async () => {
    await setup({ people: [natalie], nudge: { ...nudge, phone: '+1 416 555 0100' } });

    expect((el('sh-nudge-text') as HTMLAnchorElement).getAttribute('href'))
      .toContain('sms:+1 416 555 0100&body=');
    expect((el('sh-nudge-call') as HTMLAnchorElement).getAttribute('href'))
      .toBe('tel:+1 416 555 0100');
  });

  it('hides the nudge card when the server sends none', async () => {
    await setup({ people: [natalie], nudge: null });
    expect(el('sh-nudge-card')).toBeNull();
  });

  it('Done records the contact and refetches — the card disappears', async () => {
    await setup({ people: [marcus], nudge });

    (el('sh-nudge-done') as HTMLButtonElement).click();
    await settle();

    expect(peopleMock.recordContact).toHaveBeenCalledWith('p-2');
    expect(el('sh-nudge-card')).toBeNull();
  });

  it('Not today snoozes and refetches — the card disappears', async () => {
    await setup({ people: [marcus], nudge });

    (el('sh-nudge-snooze') as HTMLButtonElement).click();
    await settle();

    expect(peopleMock.snooze).toHaveBeenCalledWith('p-2');
    expect(el('sh-nudge-card')).toBeNull();
  });

  it('the add row opens the person sheet and refreshes the list after a save', async () => {
    sheetResult = natalie;
    await setup({ people: [] });

    (el('sh-add-person') as HTMLButtonElement).click();

    expect(openSheet).toHaveBeenCalledTimes(1);
    // Initial load + refresh after the sheet closed with a saved person.
    expect(peopleMock.list).toHaveBeenCalledTimes(2);
  });

  it('a dismissed sheet does not refetch', async () => {
    sheetResult = undefined;
    await setup({ people: [] });

    (el('sh-add-person') as HTMLButtonElement).click();

    expect(peopleMock.list).toHaveBeenCalledTimes(1);
  });
});
