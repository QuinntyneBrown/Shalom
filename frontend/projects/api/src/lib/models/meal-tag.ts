/** The fixed meal-tag vocabulary — patterns, not calories. */
export type MealTag = 'home-cooked' | 'fish' | 'veggie' | 'takeout' | 'late-night';

/** All tags in display order (mirrors the meal sheet design). */
export const MEAL_TAGS: readonly MealTag[] = [
  'home-cooked',
  'fish',
  'veggie',
  'takeout',
  'late-night',
];
