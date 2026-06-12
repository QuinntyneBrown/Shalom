import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoveryCard } from './discovery-card';

@Component({
  standalone: true,
  imports: [DiscoveryCard],
  template: `
    <sh-discovery-card
      icon="lightbulb"
      title="Meal notes"
      body="Jot what you ate — patterns, not calories."
      [ctaLabel]="ctaLabel()"
      [soon]="soon()"
      (cta)="ctas = ctas + 1"
      (dismissed)="dismissals = dismissals + 1"
    />
  `,
})
class Host {
  readonly ctaLabel = signal<string | null>('Try it');
  readonly soon = signal(false);
  ctas = 0;
  dismissals = 0;
}

describe('DiscoveryCard', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders icon, title, body, and the CTA', () => {
    expect(el().querySelector('.icon')?.textContent).toContain('lightbulb');
    expect(el().querySelector('.title')?.textContent).toContain('Meal notes');
    expect(el().querySelector('.body')?.textContent).toContain('patterns, not calories');
    expect(el().querySelector('[data-testid="sh-discovery-cta"]')?.textContent).toContain('Try it');
  });

  it('emits cta and dismissed', () => {
    (el().querySelector('[data-testid="sh-discovery-cta"]') as HTMLButtonElement).click();
    (el().querySelector('[data-testid="sh-discovery-dismiss"]') as HTMLButtonElement).click();

    expect(host.ctas).toBe(1);
    expect(host.dismissals).toBe(1);
  });

  it('hides the CTA when absent and shows the soon pill for teasers', () => {
    host.ctaLabel.set(null);
    host.soon.set(true);
    fixture.detectChanges();

    expect(el().querySelector('[data-testid="sh-discovery-cta"]')).toBeNull();
    expect(el().querySelector('.soon-pill')?.textContent).toContain('soon');
  });
});
