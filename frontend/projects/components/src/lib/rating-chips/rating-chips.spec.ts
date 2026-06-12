import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatingChips } from './rating-chips';

@Component({
  standalone: true,
  imports: [RatingChips],
  template: `<sh-rating-chips [(value)]="value" />`,
})
class Host {
  readonly value = signal<number | null>(null);
}

describe('RatingChips', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  function chips(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button.chip'));
  }

  it('renders the five labels Heavy/Tense/Flat/Steady/Full', () => {
    expect(chips().map((c) => c.textContent?.trim())).toEqual([
      'Heavy',
      'Tense',
      'Flat',
      'Steady',
      'Full',
    ]);
  });

  it('selecting a chip emits its 1-5 value through the model', () => {
    chips()[3].click(); // Steady
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(4);
    expect(chips()[3].classList.contains('selected')).toBe(true);
    expect(chips()[3].getAttribute('aria-pressed')).toBe('true');
  });

  it('selection is single-select — picking another chip moves it', () => {
    chips()[0].click();
    fixture.detectChanges();
    chips()[4].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(5);
    expect(chips().filter((c) => c.classList.contains('selected'))).toHaveLength(1);
  });

  it('reflects a value written from the host (saved check-in on load)', () => {
    fixture.componentInstance.value.set(2);
    fixture.detectChanges();

    expect(chips()[1].classList.contains('selected')).toBe(true);
  });
});
