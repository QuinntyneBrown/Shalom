import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AddGratitudeRequest, GRATITUDE_SERVICE, GratitudeEntryDto, IGratitudeService } from 'api';
import { GratitudeDialog, GratitudeDialogData } from './gratitude.dialog';

const saved: GratitudeEntryDto = {
  id: 'g-1',
  personId: 'p-1',
  text: 'The way she prayed with the girls last night.',
  occurredOn: '2026-06-12',
};

describe('GratitudeDialog', () => {
  let fixture: ComponentFixture<GratitudeDialog>;
  let addCalls: AddGratitudeRequest[];
  let close: ReturnType<typeof vi.fn>;

  async function setup(data?: GratitudeDialogData): Promise<void> {
    addCalls = [];
    close = vi.fn();
    const gratitudeMock: IGratitudeService = {
      add: async (req) => {
        addCalls.push(req);
        return saved;
      },
      list: async () => [],
    };

    await TestBed.configureTestingModule({
      imports: [GratitudeDialog],
      providers: [
        { provide: GRATITUDE_SERVICE, useValue: gratitudeMock },
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: data ?? null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GratitudeDialog);
    fixture.detectChanges();
  }

  function el(testid: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  function type(value: string): void {
    const area = el('sh-sheet-gratitude-text') as HTMLTextAreaElement;
    area.value = value;
    area.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('frames the note as private and disables save until text exists', async () => {
    await setup({ personId: 'p-1' });

    expect(fixture.nativeElement.textContent).toContain('Just between you and God.');
    const save = el('sh-sheet-save-gratitude') as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    type('The way she prayed with the girls last night.');
    expect(save.disabled).toBe(false);
  });

  it('saves the trimmed note linked to the person and closes with the result', async () => {
    await setup({ personId: 'p-1' });
    type('  The way she prayed with the girls last night.  ');

    el('sh-sheet-save-gratitude').click();
    await fixture.whenStable();

    expect(addCalls).toEqual([
      { text: 'The way she prayed with the girls last night.', personId: 'p-1' },
    ]);
    expect(close).toHaveBeenCalledWith(saved);
  });

  it('saves unlinked when opened without a person', async () => {
    await setup();
    type('Sunrise over the lake.');

    el('sh-sheet-save-gratitude').click();
    await fixture.whenStable();

    expect(addCalls).toEqual([{ text: 'Sunrise over the lake.', personId: null }]);
  });
});
