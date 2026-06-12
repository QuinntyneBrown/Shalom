import { Locator, Page } from '@playwright/test';

import { peoplePageSelectors as S } from '../helpers/people-page.selectors';
import { BasePage } from './base.page';

/**
 * People page (`/people`) — Today's-nudge card (server-selected, at most
 * one per day), the circle list with last-contact captions and the
 * connected-today gold dot, and the "Someone on your heart…" add sheet.
 */
export class PeoplePage extends BasePage {
  readonly heading: Locator;
  readonly tagline: Locator;

  readonly nudgeCard: Locator;
  readonly nudgePrompt: Locator;
  readonly nudgeText: Locator;
  readonly nudgeCall: Locator;
  readonly nudgeDone: Locator;
  readonly nudgeSnooze: Locator;

  readonly peopleList: Locator;
  readonly personRows: Locator;
  readonly addPerson: Locator;

  // Add/edit person sheet (renders in the CDK overlay container).
  readonly sheetPersonName: Locator;
  readonly sheetPersonRelationship: Locator;
  readonly sheetPersonPhone: Locator;
  readonly sheetPersonCadence: Locator;
  readonly sheetSavePerson: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(S.heading);
    this.tagline = page.locator(S.tagline);

    this.nudgeCard = page.locator(S.nudgeCard);
    this.nudgePrompt = page.locator(S.nudgePrompt);
    this.nudgeText = page.locator(S.nudgeText);
    this.nudgeCall = page.locator(S.nudgeCall);
    this.nudgeDone = page.locator(S.nudgeDone);
    this.nudgeSnooze = page.locator(S.nudgeSnooze);

    this.peopleList = page.locator(S.peopleList);
    this.personRows = page.locator(S.personRow);
    this.addPerson = page.locator(S.addPerson);

    this.sheetPersonName = page.locator(S.sheetPersonName);
    this.sheetPersonRelationship = page.locator(S.sheetPersonRelationship);
    this.sheetPersonPhone = page.locator(S.sheetPersonPhone);
    this.sheetPersonCadence = page.locator(S.sheetPersonCadence);
    this.sheetSavePerson = page.locator(S.sheetSavePerson);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/people');
  }

  /** The list row for a person, matched by their (unique in tests) name. */
  personRow(name: string): Locator {
    return this.personRows.filter({ hasText: name });
  }

  /** Gold connected-today dot inside one person's row. */
  connectedDot(name: string): Locator {
    return this.personRow(name).locator(S.connectedDot);
  }

  /** Fills and saves the add-person sheet (assumes it is already open). */
  async fillPersonSheet(options: {
    name: string;
    relationship?: string;
    phone?: string;
    cadence?: '' | '7' | '14' | '30';
  }): Promise<void> {
    await this.sheetPersonName.fill(options.name);
    if (options.relationship) await this.sheetPersonRelationship.fill(options.relationship);
    if (options.phone) await this.sheetPersonPhone.fill(options.phone);
    if (options.cadence !== undefined) await this.sheetPersonCadence.selectOption(options.cadence);
    await this.sheetSavePerson.click();
  }
}
