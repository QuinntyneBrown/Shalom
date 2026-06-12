import { Locator, Page } from '@playwright/test';

import { signInPageSelectors as S } from '../helpers/sign-in-page.selectors';
import { BasePage } from './base.page';

/**
 * Sign-in page (`/sign-in`). Locators come from the ppg-generated
 * selectors helper; the flow helpers are hand-written.
 */
export class SignInPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberToggle: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator(S.emailInput);
    this.passwordInput = page.locator(S.passwordInput);
    this.rememberToggle = page.locator(S.rememberInput);
    this.submitButton = page.locator(S.signInButton);
    this.errorMessage = page.locator('[role="alert"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/sign-in');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
