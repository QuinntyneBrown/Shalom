import { Locator, Page } from '@playwright/test';

import { personDetailPageSelectors as S } from '../helpers/person-detail-page.selectors';
import { BasePage } from './base.page';

/**
 * Person detail page (`/people/:id`) — identity block, Text/Call/Connected
 * quick actions, important dates card, and the private gratitude card.
 */
export class PersonDetailPage extends BasePage {
  readonly back: Locator;
  readonly edit: Locator;

  readonly name: Locator;
  readonly relationship: Locator;
  readonly lastContact: Locator;

  readonly text: Locator;
  readonly call: Locator;
  readonly connected: Locator;

  readonly datesCard: Locator;
  readonly dateRows: Locator;
  readonly addDate: Locator;

  readonly gratitudeCard: Locator;
  readonly gratitudeEntries: Locator;
  readonly addNote: Locator;

  // "Add a date" sheet (renders in the CDK overlay container).
  readonly sheetDateLabel: Locator;
  readonly sheetDateMonth: Locator;
  readonly sheetDateDay: Locator;
  readonly sheetDateYear: Locator;
  readonly sheetSaveDate: Locator;

  // Gratitude sheet.
  readonly sheetGratitudeText: Locator;
  readonly sheetSaveGratitude: Locator;

  constructor(page: Page) {
    super(page);
    this.back = page.locator(S.back);
    this.edit = page.locator(S.edit);

    this.name = page.locator(S.name);
    this.relationship = page.locator(S.relationship);
    this.lastContact = page.locator(S.lastContact);

    this.text = page.locator(S.text);
    this.call = page.locator(S.call);
    this.connected = page.locator(S.connected);

    this.datesCard = page.locator(S.datesCard);
    this.dateRows = page.locator(S.dateRow);
    this.addDate = page.locator(S.addDate);

    this.gratitudeCard = page.locator(S.gratitudeCard);
    this.gratitudeEntries = page.locator(S.gratitudeEntry);
    this.addNote = page.locator(S.addNote);

    this.sheetDateLabel = page.locator(S.sheetDateLabel);
    this.sheetDateMonth = page.locator(S.sheetDateMonth);
    this.sheetDateDay = page.locator(S.sheetDateDay);
    this.sheetDateYear = page.locator(S.sheetDateYear);
    this.sheetSaveDate = page.locator(S.sheetSaveDate);

    this.sheetGratitudeText = page.locator(S.sheetGratitudeText);
    this.sheetSaveGratitude = page.locator(S.sheetSaveGratitude);
  }

  /** Detail pages are reached by id; prefer `navigateTo(id)`. */
  async navigate(): Promise<void> {
    await this.page.goto('/people');
  }

  async navigateTo(personId: string): Promise<void> {
    await this.page.goto(`/people/${personId}`);
  }

  /** The important-date row matched by its label. */
  dateRow(label: string): Locator {
    return this.dateRows.filter({ hasText: label });
  }

  /** Remove affordance inside one date row. */
  dateRemove(label: string): Locator {
    return this.dateRow(label).locator(S.dateRemove);
  }
}
