import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import {
  GRATITUDE_SERVICE,
  GratitudeEntryDto,
  IGratitudeService,
  IPeopleService,
  PEOPLE_SERVICE,
  PersonDetailDto,
} from 'api';
import { SheetOpener } from '../../dialogs/sheet';
import { PersonDetailPage } from './person-detail.page';

const detail: PersonDetailDto = {
  id: 'p-1',
  name: 'Natalie',
  relationship: 'Wife',
  phone: '+1 416 555 0100',
  contactCadenceDays: 2,
  notes: null,
  lastContactedOn: null,
  snoozedUntil: null,
  dates: [
    {
      id: 'd-1',
      personId: 'p-1',
      label: 'Anniversary',
      month: 8,
      day: 23,
      year: null,
      leadDays: 7,
      nextOccurrence: '2026-08-23',
      daysUntil: 72,
    },
  ],
};

const note: GratitudeEntryDto = {
  id: 'g-1',
  personId: 'p-1',
  text: 'The way she prayed with the girls last night.',
  occurredOn: '2026-06-08',
};

describe('PersonDetailPage', () => {
  let fixture: ComponentFixture<PersonDetailPage>;
  let peopleMock: IPeopleService;
  let gratitudeMock: IGratitudeService;
  let openSheet: ReturnType<typeof vi.fn>;
  let sheetResult: unknown;

  async function setup(options?: {
    person?: PersonDetailDto;
    gratitude?: GratitudeEntryDto[];
  }): Promise<void> {
    peopleMock = {
      list: vi.fn(),
      get: vi.fn(async () => options?.person ?? detail),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      recordContact: vi.fn(async () => ({ ...detail, lastContactedOn: '2026-06-12' })),
      snooze: vi.fn(),
      nudges: vi.fn(async () => []),
      addDate: vi.fn(),
      removeDate: vi.fn(async () => undefined),
    } as unknown as IPeopleService;
    gratitudeMock = {
      add: vi.fn(),
      list: vi.fn(async () => options?.gratitude ?? [note]),
    } as unknown as IGratitudeService;
    openSheet = vi.fn(() => ({ closed: of(sheetResult) }));

    await TestBed.configureTestingModule({
      imports: [PersonDetailPage],
      providers: [
        provideRouter([]),
        { provide: PEOPLE_SERVICE, useValue: peopleMock },
        { provide: GRATITUDE_SERVICE, useValue: gratitudeMock },
        { provide: SheetOpener, useValue: { open: openSheet } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'p-1']]) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonDetailPage);
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

  it('renders the identity block and quick actions with sms/tel hrefs', async () => {
    await setup();

    expect(el('sh-detail-name')?.textContent?.trim()).toBe('Natalie');
    expect(el('sh-detail-relationship')?.textContent?.trim()).toBe('Wife');
    expect(fixture.nativeElement.querySelector('.identity .avatar')?.textContent?.trim()).toBe('N');
    expect((el('sh-detail-text') as HTMLAnchorElement).getAttribute('href'))
      .toContain('sms:+1 416 555 0100&body=');
    expect((el('sh-detail-call') as HTMLAnchorElement).getAttribute('href'))
      .toBe('tel:+1 416 555 0100');
  });

  it('omits Text and Call when the person has no phone', async () => {
    await setup({ person: { ...detail, phone: null } });

    expect(el('sh-detail-text')).toBeNull();
    expect(el('sh-detail-call')).toBeNull();
    expect(el('sh-detail-connected')).not.toBeNull();
  });

  it('lists important dates with the formatted next occurrence and daysUntil', async () => {
    await setup();

    const row = el('sh-date-row');
    expect(row?.textContent).toContain('Anniversary');
    expect(row?.textContent).toContain('Aug 23');
    expect(row?.textContent).toContain('in 72 days');
  });

  it('Connected records the contact and reloads the person', async () => {
    await setup();

    (el('sh-detail-connected') as HTMLButtonElement).click();
    await settle();

    expect(peopleMock.recordContact).toHaveBeenCalledWith('p-1');
    expect(peopleMock.get).toHaveBeenCalledTimes(2);
  });

  it('lists gratitude notes with the private framing', async () => {
    await setup();

    expect(fixture.nativeElement.textContent).toContain('just between you and God');
    expect(el('sh-gratitude-entry')?.textContent).toContain('The way she prayed with the girls');
  });

  it('the date sheet refreshes the person after a save', async () => {
    sheetResult = detail.dates[0];
    await setup();

    (el('sh-detail-add-date') as HTMLButtonElement).click();
    await settle();

    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(openSheet.mock.calls[0][1]).toEqual({ personId: 'p-1' });
    expect(peopleMock.get).toHaveBeenCalledTimes(2);
  });

  it('a saved gratitude note is prepended without a reload', async () => {
    const fresh: GratitudeEntryDto = { ...note, id: 'g-2', text: 'New note.' };
    sheetResult = fresh;
    await setup();

    (el('sh-detail-add-note') as HTMLButtonElement).click();
    fixture.detectChanges();

    const entries = fixture.nativeElement.querySelectorAll('[data-testid="sh-gratitude-entry"]');
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toContain('New note.');
  });

  it('removing a date calls the API and reloads', async () => {
    await setup();

    (el('sh-date-remove') as HTMLButtonElement).click();
    await settle();

    expect(peopleMock.removeDate).toHaveBeenCalledWith('d-1');
    expect(peopleMock.get).toHaveBeenCalledTimes(2);
  });

  it('the edit pencil opens the person sheet with the loaded person', async () => {
    sheetResult = undefined;
    await setup();

    (el('sh-detail-edit') as HTMLButtonElement).click();

    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(openSheet.mock.calls[0][1]).toEqual({ person: detail });
  });

  it('navigates back to /people when the person cannot be loaded', async () => {
    await setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    (peopleMock.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('404'));
    (gratitudeMock.list as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('404'));

    const page = fixture.componentInstance as unknown as { load(): Promise<void> };
    await page.load();

    expect(navigate).toHaveBeenCalledWith('/people');
  });
});
