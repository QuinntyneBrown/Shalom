import { expect, localIsoDate, test } from '../fixtures/sh-test';
import { addDaysIso } from '../helpers/dates';

test.describe('people', () => {
  // Repeat-run safe: every person a test creates is archived via the API
  // afterwards (names are unique per run, so leftovers from crashed runs
  // never collide with assertions).
  let createdIds: string[] = [];

  test.beforeEach(() => {
    createdIds = [];
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdIds) {
      await api.archivePerson(id);
    }
  });

  test('adding someone through the sheet shows them in the circle', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    const name = `E2E Friend ${Date.now()}`;
    await signInAsSeededUser();
    await pages.people.navigate();
    await expect(pages.people.peopleList).toBeVisible();

    await pages.people.addPerson.click();
    await expect(pages.people.sheetPersonName).toBeVisible();
    await pages.people.fillPersonSheet({ name, relationship: 'Friend', cadence: '7' });
    await expect(pages.people.sheetSavePerson).toHaveCount(0);

    const row = pages.people.personRow(name);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Friend');

    // And the API agrees, including the weekly cadence from the select.
    const stored = (await api.listPeople()).find((p) => p.name === name);
    expect(stored).toBeDefined();
    expect(stored!.contactCadenceDays).toBe(7);
    createdIds.push(stored!.id);
  });

  test('Connected on the detail page yields the connected-today caption and gold dot', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    const name = `E2E Marcus ${Date.now()}`;
    const person = await api.createPerson({ name, relationship: 'Friend', contactCadenceDays: 14 });
    createdIds.push(person.id);

    await signInAsSeededUser();
    await pages.personDetail.navigateTo(person.id);
    await expect(pages.personDetail.name).toHaveText(name);

    await pages.personDetail.connected.click();
    await expect(pages.personDetail.lastContact).toHaveText('connected today');

    await pages.people.navigate();
    const row = pages.people.personRow(name);
    await expect(row).toContainText('Friend · connected today');
    await expect(pages.people.connectedDot(name)).toBeVisible();
  });

  test('a gratitude note saved from the sheet appears on the person', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    const name = `E2E Natalie ${Date.now()}`;
    const noteText = `Grateful note ${Date.now()}`;
    const person = await api.createPerson({ name, relationship: 'Wife' });
    createdIds.push(person.id);

    await signInAsSeededUser();
    await pages.personDetail.navigateTo(person.id);
    await expect(pages.personDetail.gratitudeCard).toBeVisible();

    await pages.personDetail.addNote.click();
    await pages.personDetail.sheetGratitudeText.fill(noteText);
    await pages.personDetail.sheetSaveGratitude.click();
    await expect(pages.personDetail.sheetSaveGratitude).toHaveCount(0);

    await expect(pages.personDetail.gratitudeEntries.first()).toContainText(noteText);
  });

  test('an important date added from the sheet appears with its daysUntil', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    const name = `E2E Maya ${Date.now()}`;
    const person = await api.createPerson({ name, relationship: 'Daughter' });
    createdIds.push(person.id);

    // Five days out, so the derived caption is stable for the test.
    const target = addDaysIso(localIsoDate(), 5);
    const [, month, day] = target.split('-').map(Number);

    await signInAsSeededUser();
    await pages.personDetail.navigateTo(person.id);
    await expect(pages.personDetail.datesCard).toBeVisible();

    await pages.personDetail.addDate.click();
    await pages.personDetail.sheetDateLabel.fill('Birthday');
    await pages.personDetail.sheetDateMonth.selectOption(String(month));
    await pages.personDetail.sheetDateDay.fill(String(day));
    await pages.personDetail.sheetSaveDate.click();
    await expect(pages.personDetail.sheetSaveDate).toHaveCount(0);

    const row = pages.personDetail.dateRow('Birthday');
    await expect(row).toBeVisible();
    await expect(row).toContainText('in 5 days');

    // The row affordance removes it again.
    await pages.personDetail.dateRemove('Birthday').click();
    await expect(row).toHaveCount(0);
  });
});
