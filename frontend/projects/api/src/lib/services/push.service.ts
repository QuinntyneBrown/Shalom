import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { SubscribeToPushRequest } from '../models/subscribe-to-push-request';
import { VapidPublicKeyDto } from '../models/vapid-public-key-dto';
import { IPushService } from './push.service.contract';

/**
 * Real HTTP `IPushService`. Bound to `PUSH_SERVICE` in the application
 * composition root.
 */
@Injectable({ providedIn: 'root' })
export class PushService implements IPushService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async subscribe(req: SubscribeToPushRequest): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/api/push/subscribe`, req));
  }

  async unsubscribe(endpoint: string): Promise<void> {
    // DELETE carries the endpoint in the body (it can exceed URL limits).
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/api/push/subscribe`, { body: { endpoint } }),
    );
  }

  async vapidPublicKey(): Promise<string> {
    const dto = await firstValueFrom(
      this.http.get<VapidPublicKeyDto>(`${this.baseUrl}/api/push/vapid-public-key`),
    );
    return dto.publicKey;
  }
}
