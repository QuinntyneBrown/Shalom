import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { vi } from 'vitest';

import { IPushService, PUSH_SERVICE } from 'api';

import { PushReminders } from './push-reminders';

function fakeSubscription(endpoint = 'https://push.example.com/send/abc'): PushSubscription {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p-key', auth: 'a-key' } }),
  } as unknown as PushSubscription;
}

interface ClickEvent {
  action: string;
  notification: { data?: { url?: string } };
}

class SwPushMock {
  isEnabled = true;
  subscription = new BehaviorSubject<PushSubscription | null>(null);
  notificationClicks = new Subject<ClickEvent>();
  requestSubscription = vi.fn(async () => fakeSubscription());
  unsubscribe = vi.fn(async () => undefined);
}

describe('PushReminders', () => {
  let swPush: SwPushMock;
  let api: { vapidPublicKey: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn>; unsubscribe: ReturnType<typeof vi.fn> };
  let notification: { permission: NotificationPermission };

  function setup(options?: { swEnabled?: boolean }): PushReminders {
    swPush = new SwPushMock();
    swPush.isEnabled = options?.swEnabled ?? true;
    api = {
      vapidPublicKey: vi.fn(async () => 'BServerKey'),
      subscribe: vi.fn(async () => undefined),
      unsubscribe: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SwPush, useValue: swPush },
        { provide: PUSH_SERVICE, useValue: api as unknown as IPushService },
      ],
    });
    return TestBed.inject(PushReminders);
  }

  beforeEach(() => {
    notification = { permission: 'default' };
    vi.stubGlobal('Notification', notification);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('enable() subscribes with the prefetched VAPID key and registers server-side', async () => {
    const service = setup();
    await Promise.resolve(); // let the constructor prefetch settle

    const state = await service.enable();

    expect(state).toBe('on');
    expect(swPush.requestSubscription).toHaveBeenCalledWith({ serverPublicKey: 'BServerKey' });
    expect(api.subscribe).toHaveBeenCalledWith({
      endpoint: 'https://push.example.com/send/abc',
      p256dh: 'p-key',
      auth: 'a-key',
    });
    expect(service.state()).toBe('on');
  });

  it('enable() stays calm when the permission comes back denied', async () => {
    const service = setup();
    // A denied permission makes the browser reject every request.
    swPush.requestSubscription.mockRejectedValue(new Error('Permission denied'));

    const result = await service.enable();
    // The OS-level no arrived during the request.
    notification.permission = 'denied';
    const second = await service.enable();

    expect(result).toBe('off'); // transient failure, permission still default
    expect(second).toBe('denied');
    expect(service.state()).toBe('denied');
    expect(api.subscribe).not.toHaveBeenCalled();
  });

  it('is unsupported without a service worker — and enable() says so without throwing', async () => {
    const service = setup({ swEnabled: false });

    expect(service.state()).toBe('unsupported');
    await expect(service.enable()).resolves.toBe('unsupported');
    expect(swPush.requestSubscription).not.toHaveBeenCalled();
  });

  it('disable() unsubscribes both browser-side and server-side', async () => {
    const service = setup();
    await service.enable();

    await service.disable();

    expect(swPush.unsubscribe).toHaveBeenCalledTimes(1);
    expect(api.unsubscribe).toHaveBeenCalledWith('https://push.example.com/send/abc');
    expect(service.state()).toBe('off');
  });

  it('start() follows notification-click deep links', async () => {
    const service = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    service.start();
    swPush.notificationClicks.next({
      action: 'default',
      notification: { data: { url: '/people/abc-123' } },
    });

    expect(navigate).toHaveBeenCalledWith('/people/abc-123');
  });

  it('optInAvailable() requires standalone display, default permission and push support', () => {
    const service = setup();

    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    expect(service.optInAvailable()).toBe(true);

    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    expect(service.optInAvailable()).toBe(false); // browser tab, not installed
  });

  it('optInAvailable() is false once a subscription exists or permission left default', async () => {
    const service = setup();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));

    await service.enable(); // now 'on'
    expect(service.optInAvailable()).toBe(false);

    await service.disable();
    notification.permission = 'denied';
    await service.enable(); // refreshes the permission signal
    expect(service.optInAvailable()).toBe(false);
  });
});
