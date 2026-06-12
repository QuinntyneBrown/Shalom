/**
 * Base Page Object — common plumbing for all page objects.
 * Adapted from the `ppg workspace` generated base class.
 */

import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to the page. */
  abstract navigate(): Promise<void>;

  protected getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }
}
