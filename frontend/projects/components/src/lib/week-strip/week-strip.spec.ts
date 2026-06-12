import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeekStrip, WeekDayState } from './week-strip';

@Component({
  standalone: true,
  imports: [WeekStrip],
  template: `<sh-week-strip [states]="states()" />`,
})
class Host {
  readonly states = signal<WeekDayState[]>([
    'done', 'done', 'done', 'grace', 'ahead', 'ahead', 'ahead',
  ]);
}

describe('WeekStrip', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders seven Monday-first day dots with their states', () => {
    const el: HTMLElement = fixture.nativeElement;
    const labels = Array.from(el.querySelectorAll('.day .label')).map((n) => n.textContent);
    expect(labels).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);

    const dots = el.querySelectorAll('.days .dot');
    expect(dots).toHaveLength(7);
    expect(dots[0].classList.contains('done')).toBe(true);
    expect(dots[3].classList.contains('grace')).toBe(true);
    expect(dots[6].classList.contains('ahead')).toBe(true);
  });

  it('renders the done/grace/ahead legend', () => {
    const legend: HTMLElement = fixture.nativeElement.querySelector('.legend');
    expect(legend.textContent).toContain('done');
    expect(legend.textContent).toContain('grace');
    expect(legend.textContent).toContain('ahead');
  });

  it('treats missing trailing states as ahead', () => {
    fixture.componentInstance.states.set(['done']);
    fixture.detectChanges();

    const dots = fixture.nativeElement.querySelectorAll('.days .dot');
    expect(dots[1].classList.contains('ahead')).toBe(true);
    expect(dots[6].classList.contains('ahead')).toBe(true);
  });
});
