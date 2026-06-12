import { DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { vi } from 'vitest';

import { IPushService, PUSH_SERVICE } from 'api';

import { RemindersDialog } from './reminders.dialog';

function fakeSubscription(endpoint = 'https://push.example.com/send/abc'): PushSubscription {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p-key', auth: 'a-key' } }),
  } as unknown as PushSubscription;
}

class SwPushMock {
  isEnabled = true;
  subscription = new BehaviorSubject<PushSubscription | null>(null);
  notificationClicks = new Subject<unknown>();
  requestSubscription = vi.fn(async () => fakeSubscription());
  unsubscribe = vi.fn(async () => undefined);
}

/**
 * The Settings → REMINDERS flow with a mocked SwPush: the sheet explains
 * the 2–3 moments, the enable tap runs the real subscribe flow, denied is
 * met with the calm line, and an uninstalled context stays graceful.
 */
describe('RemindersDialog', () => {
  let fixture: ComponentFixture<RemindersDialog>;
  let swPush: SwPushMock;
  let api: { vapidPublicKey: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn>; unsubscribe: ReturnType<typeof vi.fn> };
  let close: ReturnType<typeof vi.fn>;
  let notification: { permission: NotificationPermission };

  async function setup(options?: { swEnabled?: boolean }): Promise<void> {
    swPush = new SwPushMock();
    swPush.isEnabled = options?.swEnabled ?? true;
    api = {
      vapidPublicKey: vi.fn(async () => 'BServerKey'),
      subscribe: vi.fn(async () => undefined),
      unsubscribe: vi.fn(async () => undefined),
    };
    close = vi.fn();

    await TestBed.configureTestingModule({
      imports: [RemindersDialog],
      providers: [
        provideRouter([]),
        { provide: SwPush, useValue: swPush },
        { provide: PUSH_SERVICE, useValue: api as unknown as IPushService },
        { provide: DialogRef, useValue: { close } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemindersDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function el<T extends HTMLElement>(testid: string): T | null {
    return (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testid}"]`);
  }

  beforeEach(() => {
    notification = { permission: 'default' };
    vi.stubGlobal('Notification', notification);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('explains the two-or-three moments and offers the enable tap', async () => {
    await setup();

    expect(el('sh-sheet-reminders-copy')?.textContent).toContain(
      'A tap on the shoulder when your window opens',
    );
    expect(el('sh-sheet-reminders-enable')?.textContent).toContain('Turn on nudges');
    expect(el('sh-sheet-reminders-disable')).toBeNull();
  });

  it('the enable tap subscribes and the sheet flips to on with a turn-off', async () => {
    await setup();

    el('sh-sheet-reminders-enable')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(swPush.requestSubscription).toHaveBeenCalledWith({ serverPublicKey: 'BServerKey' });
    expect(api.subscribe).toHaveBeenCalledTimes(1);
    expect(el('sh-sheet-reminders-status')?.textContent).toContain('Nudges are on');
    expect(el('sh-sheet-reminders-disable')).not.toBeNull();
    expect(el('sh-sheet-reminders-enable')).toBeNull();
  });

  it('turn-off unsubscribes and returns to the off state', async () => {
    await setup();
    el('sh-sheet-reminders-enable')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    el('sh-sheet-reminders-disable')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(swPush.unsubscribe).toHaveBeenCalledTimes(1);
    expect(api.unsubscribe).toHaveBeenCalledWith('https://push.example.com/send/abc');
    expect(el('sh-sheet-reminders-enable')).not.toBeNull();
  });

  it('denied permission gets the calm line, not a nag', async () => {
    await setup();
    swPush.requestSubscription.mockImplementationOnce(async () => {
      notification.permission = 'denied';
      throw new Error('Permission denied');
    });

    el('sh-sheet-reminders-enable')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el('sh-sheet-reminders-status')?.textContent).toContain(
      'No problem — Shalom works just as well without taps on the shoulder.',
    );
    expect(el('sh-sheet-reminders-enable')).toBeNull();
  });

  it('without a service worker the sheet stays graceful and Okay closes it', async () => {
    await setup({ swEnabled: false });

    expect(el('sh-sheet-reminders-status')?.textContent).toContain('Home Screen');
    expect(el('sh-sheet-reminders-enable')).toBeNull();

    el('sh-sheet-reminders-close')!.click();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
