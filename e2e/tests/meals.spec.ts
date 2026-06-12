import { expect, test } from '../fixtures/sh-test';

test.describe('meals', () => {
  test('logging a meal updates the last-meal line', async ({
    pages,
    signInAsSeededUser,
  }) => {
    // Meals have no delete endpoint (by design — patterns accumulate);
    // a unique text keeps the assertion specific to this run.
    const text = `e2e salmon + greens ${Date.now()}`;

    await signInAsSeededUser();
    await pages.health.navigate();
    await expect(pages.health.mealsCard).toBeVisible();

    await pages.health.logMealButton.click();
    await expect(pages.health.sheetSaveMeal).toBeDisabled();

    await pages.health.sheetMealText.fill(text);
    await pages.health.sheetMealTag('home-cooked').click();
    await pages.health.sheetMealTag('fish').click();
    await expect(pages.health.sheetSaveMeal).toBeEnabled();

    await pages.health.sheetSaveMeal.click();
    await expect(pages.health.sheetSaveMeal).toHaveCount(0);

    await expect(pages.health.lastMeal).toHaveText(`Today: ${text}`);
  });
});
