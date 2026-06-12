import { Locator, Page } from '@playwright/test';

import { fastDetailPageSelectors as S } from '../helpers/fast-detail-page.selectors';
import { BasePage } from './base.page';

/**
 * Fast detail page (`/health/fasting`) — big live ring, started/window
 * lines, the grace-forward end-fast flow, and the read-only schedule card.
 */
export class FastDetailPage extends BasePage {
  readonly back: Locator;
  readonly heading: Locator;

  readonly ring: Locator;
  readonly elapsed: Locator;
  readonly none: Locator;
  readonly started: Locator;
  readonly window: Locator;
  readonly endButton: Locator;

  readonly scheduleCard: Locator;
  readonly scheduleDefault: Locator;
  readonly scheduleSunday: Locator;

  readonly confirmAccept: Locator;
  readonly confirmCancel: Locator;

  constructor(page: Page) {
    super(page);
    this.back = page.locator(S.back);
    this.heading = page.locator(S.heading);

    this.ring = page.locator(S.ring);
    this.elapsed = page.locator(S.elapsed);
    this.none = page.locator(S.none);
    this.started = page.locator(S.started);
    this.window = page.locator(S.window);
    this.endButton = page.locator(S.endButton);

    this.scheduleCard = page.locator(S.scheduleCard);
    this.scheduleDefault = page.locator(S.scheduleDefault);
    this.scheduleSunday = page.locator(S.scheduleSunday);

    this.confirmAccept = page.locator(S.confirmAccept);
    this.confirmCancel = page.locator(S.confirmCancel);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/health/fasting');
  }

  /** Clicks "End fast here" and confirms through the grace-forward sheet. */
  async endFast(): Promise<void> {
    await this.endButton.click();
    await this.confirmAccept.click();
  }
}
