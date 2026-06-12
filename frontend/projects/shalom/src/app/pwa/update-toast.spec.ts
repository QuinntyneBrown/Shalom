import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { UpdateToast } from './update-toast';

describe('UpdateToast', () => {
  let fixture: ComponentFixture<UpdateToast>;
  let versionUpdates: Subject<VersionEvent>;
  let activateUpdate: ReturnType<typeof vi.fn>;
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.restoreAllMocks(); // the prototype `reload` spy must not leak across tests
    versionUpdates = new Subject<VersionEvent>();
    activateUpdate = vi.fn(async () => true);
    // `location.reload()` would tear the test runner down — stub the seam.
    reload = vi
      .spyOn(UpdateToast.prototype as unknown as { reload(): void }, 'reload')
      .mockImplementation(() => undefined) as unknown as ReturnType<typeof vi.fn>;

    await TestBed.configureTestingModule({
      imports: [UpdateToast],
      providers: [
        {
          provide: SwUpdate,
          useValue: { versionUpdates: versionUpdates.asObservable(), activateUpdate },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateToast);
    fixture.detectChanges();
  });

  function byTestId<T extends HTMLElement>(id: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(`[data-testid="${id}"]`);
  }

  function emitReady(): void {
    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    fixture.detectChanges();
  }

  it('stays hidden until a new version is READY (detection alone is not enough)', () => {
    expect(byTestId('sh-update-toast')).toBeNull();

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } } as VersionEvent);
    fixture.detectChanges();
    expect(byTestId('sh-update-toast')).toBeNull();

    emitReady();
    expect(byTestId('sh-update-toast')!.textContent).toContain(
      'A quieter, newer Shalom is ready — refresh',
    );
  });

  it('tapping the toast activates the update and reloads', async () => {
    emitReady();

    byTestId<HTMLButtonElement>('sh-update-toast-refresh')!.click();
    await fixture.whenStable();

    expect(activateUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads even when activation rejects (iOS sticky-worker escape hatch)', async () => {
    activateUpdate.mockRejectedValueOnce(new Error('activation raced'));
    emitReady();

    byTestId<HTMLButtonElement>('sh-update-toast-refresh')!.click();
    await fixture.whenStable();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('the dismiss button quiets the toast without reloading', () => {
    emitReady();

    byTestId<HTMLButtonElement>('sh-update-toast-dismiss')!.click();
    fixture.detectChanges();

    expect(byTestId('sh-update-toast')).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it('is inert when SwUpdate is not provided at all', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [UpdateToast] }).compileComponents();
    const bare = TestBed.createComponent(UpdateToast);
    bare.detectChanges();

    expect(
      (bare.nativeElement as HTMLElement).querySelector('[data-testid="sh-update-toast"]'),
    ).toBeNull();
  });
});
