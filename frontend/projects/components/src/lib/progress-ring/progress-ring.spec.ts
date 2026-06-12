import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressRing } from './progress-ring';

@Component({
  standalone: true,
  imports: [ProgressRing],
  template: `
    <sh-progress-ring [progress]="progress()" [size]="100" [stroke]="10">
      <strong class="elapsed">11h 24m</strong>
    </sh-progress-ring>
  `,
})
class Host {
  readonly progress = signal(0.5);
}

describe('ProgressRing', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  function arc(): SVGCircleElement {
    return fixture.nativeElement.querySelector('circle.arc');
  }

  it('renders a track and an arc with the dash offset for the progress', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('circle.track')).not.toBeNull();

    // size 100, stroke 10 => r 45, circumference 2*PI*45.
    const circumference = 2 * Math.PI * 45;
    expect(Number(arc().getAttribute('stroke-dasharray'))).toBeCloseTo(circumference, 3);
    expect(Number(arc().getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.5, 3);
  });

  it('clamps progress above 1 to a full ring', () => {
    fixture.componentInstance.progress.set(1.4);
    fixture.detectChanges();

    expect(Number(arc().getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 3);
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
  });

  it('clamps negative progress to an empty ring', () => {
    fixture.componentInstance.progress.set(-2);
    fixture.detectChanges();

    const circumference = 2 * Math.PI * 45;
    expect(Number(arc().getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference, 3);
  });

  it('projects center content', () => {
    const center = fixture.nativeElement.querySelector('.center .elapsed');
    expect(center?.textContent).toBe('11h 24m');
  });
});
