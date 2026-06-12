import { expect, test } from '../fixtures/sh-test';

/**
 * Connection nudges are derived server-side (ADR-004): never stored, one
 * per day max, suppressed entirely once anyone was contacted today, and
 * "Not today" snoozes without a trace of guilt.
 *
 * Each test starts from a clean slate (every active person archived) so
 * the deterministic nudge selection is fully under the test's control,
 * and stays repeat-safe via unique names + archive teardown.
 */
test.describe('connection nudges', () => {
  let createdIds: string[] = [];

  test.beforeEach(async ({ api }) => {
    createdIds = [];
    await api.archiveAllPeople();
  });

  test.afterEach(async ({ api }) => {
    for (const id of createdIds) {
      await api.archivePerson(id);
    }
  });

  test('a due person surfaces on Today and People; Not today quiets the nudge', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    // Never contacted + cadence ⇒ due (most overdue by definition).
    const name = `E2E Nudgee ${Date.now()}`;
    const person = await api.createPerson({ name, relationship: 'Friend', contactCadenceDays: 7 });
    createdIds.push(person.id);

    const due = await api.nudges();
    expect(due.some((n) => n.personId === person.id)).toBe(true);

    // Today renders the server-selected nudge…
    await signInAsSeededUser();
    await expect(pages.today.connectionCard).toBeVisible();
    await expect(pages.today.connectionPrompt).toContainText(name);

    // …and People shows the same single nudge.
    await pages.people.navigate();
    await expect(pages.people.nudgeCard).toBeVisible();
    await expect(pages.people.nudgePrompt).toContainText(name);

    // "Not today" snoozes until tomorrow — the card simply goes away.
    await pages.people.nudgeSnooze.click();
    await expect(pages.people.nudgeCard).toHaveCount(0);
    expect((await api.nudges()).some((n) => n.personId === person.id)).toBe(false);
  });

  test('recording a contact today suppresses the nudge everywhere', async ({
    api,
    pages,
    signInAsSeededUser,
  }) => {
    const name = `E2E Contacted ${Date.now()}`;
    const person = await api.createPerson({ name, relationship: 'Friend', contactCadenceDays: 7 });
    createdIds.push(person.id);

    await api.recordContact(person.id);

    // No longer due, and the day's nudge is suppressed outright.
    expect((await api.nudges()).some((n) => n.personId === person.id)).toBe(false);

    await signInAsSeededUser();
    await expect(pages.today.connectionCard).toHaveCount(0);

    await pages.people.navigate();
    await expect(pages.people.peopleList).toBeVisible();
    await expect(pages.people.nudgeCard).toHaveCount(0);
    await expect(pages.people.personRow(name)).toContainText('connected today');
  });
});
