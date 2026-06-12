import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { PushService } from './push.service';

const BASE = 'http://api.test';
const ENDPOINT = 'https://push.example.com/send/abc123';

describe('PushService', () => {
  let service: PushService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(PushService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs the flattened subscription to /api/push/subscribe', async () => {
    const promise = service.subscribe({ endpoint: ENDPOINT, p256dh: 'p-key', auth: 'a-key' });

    const req = http.expectOne(`${BASE}/api/push/subscribe`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ endpoint: ENDPOINT, p256dh: 'p-key', auth: 'a-key' });
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeUndefined();
  });

  it('DELETEs /api/push/subscribe with the endpoint in the body', async () => {
    const promise = service.unsubscribe(ENDPOINT);

    const req = http.expectOne(`${BASE}/api/push/subscribe`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ endpoint: ENDPOINT });
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeUndefined();
  });

  it('GETs the VAPID public key and unwraps it', async () => {
    const promise = service.vapidPublicKey();

    const req = http.expectOne(`${BASE}/api/push/vapid-public-key`);
    expect(req.request.method).toBe('GET');
    req.flush({ publicKey: 'BVapidKey123' });

    await expect(promise).resolves.toBe('BVapidKey123');
  });
});
