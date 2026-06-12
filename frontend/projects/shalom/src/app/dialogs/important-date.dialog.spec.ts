import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AddImportantDateRequest, IPeopleService, ImportantDateDto, PEOPLE_SERVICE } from 'api';
import { ImportantDateDialog } from './important-date.dialog';

const saved: ImportantDateDto = {
  id: 'd-1',
  personId: 'p-1',
  label: 'Anniversary',
  month: 8,
  day: 23,
  year: null,
  leadDays: 7,
  nextOccurrence: '2026-08-23',
  daysUntil: 72,
};

describe('ImportantDateDialog', () => {
  let fixture: ComponentFixture<ImportantDateDialog>;
  let addCalls: { personId: string; req: AddImportantDateRequest }[];
  let close: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    addCalls = [];
    close = vi.fn();
    const peopleMock = {
      addDate: async (personId: string, req: AddImportantDateRequest) => {
        addCalls.push({ personId, req });
        return saved;
      },
    } as unknown as IPeopleService;

    await TestBed.configureTestingModule({
      imports: [ImportantDateDialog],
      providers: [
        { provide: PEOPLE_SERVICE, useValue: peopleMock },
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: { personId: 'p-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportantDateDialog);
    fixture.detectChanges();
  });

  function el(testid: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  function type(testid: string, value: string): void {
    const field = el(testid) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('disables save until a label and a plausible day are present', () => {
    const save = el('sh-sheet-save-date') as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    type('sh-sheet-date-label', 'Anniversary');
    expect(save.disabled).toBe(true);

    type('sh-sheet-date-day', '23');
    expect(save.disabled).toBe(false);

    type('sh-sheet-date-day', '40');
    expect(save.disabled).toBe(true);
  });

  it('saves month/day without a year and closes with the result', async () => {
    type('sh-sheet-date-label', 'Anniversary');
    const month = el('sh-sheet-date-month') as HTMLSelectElement;
    month.value = '8';
    month.dispatchEvent(new Event('change'));
    type('sh-sheet-date-day', '23');

    el('sh-sheet-save-date').click();
    await fixture.whenStable();

    expect(addCalls).toEqual([{
      personId: 'p-1',
      req: { label: 'Anniversary', month: 8, day: 23, year: null },
    }]);
    expect(close).toHaveBeenCalledWith(saved);
  });

  it('includes the year when given', async () => {
    type('sh-sheet-date-label', 'Birthday');
    type('sh-sheet-date-day', '11');
    type('sh-sheet-date-year', '1990');

    el('sh-sheet-save-date').click();
    await fixture.whenStable();

    expect(addCalls[0].req.year).toBe(1990);
    expect(addCalls[0].req.month).toBe(1);
  });
});
