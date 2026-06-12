import { DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { IMealsService, LogMealRequest, MEALS_SERVICE, MealEntryDto } from 'api';
import { MealLogDialog } from './meal-log.dialog';

const saved: MealEntryDto = {
  id: 'm-1',
  text: 'salmon + greens',
  tags: ['home-cooked', 'fish'],
  occurredAt: '2026-06-11T23:30:00+00:00',
};

describe('MealLogDialog', () => {
  let fixture: ComponentFixture<MealLogDialog>;
  let logCalls: LogMealRequest[];
  let close: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    logCalls = [];
    close = vi.fn();
    const mealsMock: IMealsService = {
      log: async (req) => {
        logCalls.push(req);
        return saved;
      },
      list: async () => [],
    };

    await TestBed.configureTestingModule({
      imports: [MealLogDialog],
      providers: [
        { provide: MEALS_SERVICE, useValue: mealsMock },
        { provide: DialogRef, useValue: { close } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MealLogDialog);
    fixture.detectChanges();
  });

  function el(testid: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  function typeText(value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input.text');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('renders all five fixed tags and the no-counting subtitle', () => {
    const chips = fixture.nativeElement.querySelectorAll('.tags .chip');
    expect(chips).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('No calories. Just patterns.');
  });

  it('disables save until text is entered', () => {
    const save = el('sh-sheet-save-meal') as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    typeText('salmon + greens');
    expect(save.disabled).toBe(false);
  });

  it('toggles tag chips on and off', () => {
    el('sh-sheet-meal-tag-fish').click();
    fixture.detectChanges();
    expect(el('sh-sheet-meal-tag-fish').classList.contains('selected')).toBe(true);

    el('sh-sheet-meal-tag-fish').click();
    fixture.detectChanges();
    expect(el('sh-sheet-meal-tag-fish').classList.contains('selected')).toBe(false);
  });

  it('saves the text plus selected tags and closes with the result', async () => {
    typeText('salmon + greens');
    el('sh-sheet-meal-tag-home-cooked').click();
    el('sh-sheet-meal-tag-fish').click();
    fixture.detectChanges();

    el('sh-sheet-save-meal').click();
    await fixture.whenStable();

    expect(logCalls).toEqual([
      { text: 'salmon + greens', tags: ['home-cooked', 'fish'] },
    ]);
    expect(close).toHaveBeenCalledWith(saved);
  });
});
