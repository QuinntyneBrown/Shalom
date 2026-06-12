import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DotScale } from './dot-scale';

@Component({
  standalone: true,
  imports: [DotScale],
  template: `<sh-dot-scale [(value)]="value" />`,
})
class Host {
  readonly value = signal<number | null>(null);
}

describe('DotScale', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  function dots(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button.dot'));
  }

  it('renders four dots with Far and Near end labels', () => {
    expect(dots()).toHaveLength(4);
    const ends = Array.from(
      fixture.nativeElement.querySelectorAll('.end'),
    ).map((e) => (e as HTMLElement).textContent?.trim());
    expect(ends).toEqual(['Far', 'Near']);
  });

  it('selecting a dot emits its 1-4 value through the model', () => {
    dots()[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(3);
    expect(dots()[2].classList.contains('selected')).toBe(true);
  });

  it('selection is single-select', () => {
    dots()[0].click();
    fixture.detectChanges();
    dots()[3].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(4);
    expect(dots().filter((d) => d.classList.contains('selected'))).toHaveLength(1);
  });
});
