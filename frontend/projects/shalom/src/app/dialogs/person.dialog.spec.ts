import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { IPeopleService, PEOPLE_SERVICE, PersonDto, SavePersonRequest } from 'api';
import { PersonDialog, PersonDialogData } from './person.dialog';

const saved: PersonDto = {
  id: 'p-1',
  name: 'Natalie',
  relationship: 'Wife',
  phone: '+1 416 555 0100',
  contactCadenceDays: 7,
  notes: null,
  lastContactedOn: null,
  snoozedUntil: null,
};

describe('PersonDialog', () => {
  let fixture: ComponentFixture<PersonDialog>;
  let createCalls: SavePersonRequest[];
  let updateCalls: { id: string; req: SavePersonRequest }[];
  let close: ReturnType<typeof vi.fn>;

  async function setup(data?: PersonDialogData): Promise<void> {
    createCalls = [];
    updateCalls = [];
    close = vi.fn();
    const peopleMock = {
      create: async (req: SavePersonRequest) => {
        createCalls.push(req);
        return saved;
      },
      update: async (id: string, req: SavePersonRequest) => {
        updateCalls.push({ id, req });
        return { ...saved, ...req } as PersonDto;
      },
    } as unknown as IPeopleService;

    await TestBed.configureTestingModule({
      imports: [PersonDialog],
      providers: [
        { provide: PEOPLE_SERVICE, useValue: peopleMock },
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: data ?? null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonDialog);
    fixture.detectChanges();
  }

  function input(testid: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  function type(testid: string, value: string): void {
    const field = input(testid);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function selectCadence(value: string): void {
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('[data-testid="sh-sheet-person-cadence"]');
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('disables save until a name is entered', async () => {
    await setup();
    const save = input('sh-sheet-save-person');
    expect((save as unknown as HTMLButtonElement).disabled).toBe(true);

    type('sh-sheet-person-name', 'Natalie');
    expect((save as unknown as HTMLButtonElement).disabled).toBe(false);
  });

  it('creates a person with the chosen cadence and closes with the result', async () => {
    await setup();
    type('sh-sheet-person-name', 'Natalie');
    type('sh-sheet-person-relationship', 'Wife');
    type('sh-sheet-person-phone', '+1 416 555 0100');
    selectCadence('7');

    input('sh-sheet-save-person').click();
    await fixture.whenStable();

    expect(createCalls).toEqual([{
      name: 'Natalie',
      relationship: 'Wife',
      phone: '+1 416 555 0100',
      contactCadenceDays: 7,
      notes: null,
    }]);
    expect(close).toHaveBeenCalledWith(saved);
  });

  it('an empty cadence saves as null — no rhythm, no pressure', async () => {
    await setup();
    type('sh-sheet-person-name', 'Marcus');

    input('sh-sheet-save-person').click();
    await fixture.whenStable();

    expect(createCalls[0].contactCadenceDays).toBeNull();
    expect(createCalls[0].relationship).toBeNull();
  });

  it('prefills from an existing person and updates instead of creating', async () => {
    await setup({ person: saved });

    expect(input('sh-sheet-person-name').value).toBe('Natalie');
    expect(input('sh-sheet-person-phone').value).toBe('+1 416 555 0100');
    expect(fixture.nativeElement.querySelector('.title')?.textContent).toContain('Edit Natalie');

    type('sh-sheet-person-phone', '+1 416 555 0199');
    input('sh-sheet-save-person').click();
    await fixture.whenStable();

    expect(createCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].id).toBe('p-1');
    expect(updateCalls[0].req.phone).toBe('+1 416 555 0199');
  });
});
