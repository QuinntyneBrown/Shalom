import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflineBanner } from './offline-banner';

describe('OfflineBanner', () => {
  let fixture: ComponentFixture<OfflineBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OfflineBanner] }).compileComponents();
    fixture = TestBed.createComponent(OfflineBanner);
    fixture.detectChanges();
  });

  function banner(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('[data-testid="sh-offline-banner"]');
  }

  it('stays out of the way while online', () => {
    expect(banner()).toBeNull();
  });

  it('appears on the offline event and clears when the connection returns', () => {
    window.dispatchEvent(new Event('offline'));
    fixture.detectChanges();
    expect(banner()!.textContent).toContain(
      "You're offline — Shalom will catch up when you're back.",
    );

    window.dispatchEvent(new Event('online'));
    fixture.detectChanges();
    expect(banner()).toBeNull();
  });
});
