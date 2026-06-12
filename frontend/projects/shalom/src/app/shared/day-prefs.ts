import { EQUIPMENT_LABELS, EquipmentType } from 'api';

/**
 * Per-day, device-local preferences (no backend): the movement intention
 * picked in the ritual's day preview / the Today movement card, and the
 * evening "Not tonight" dismissal. Keyed by local date so yesterday's
 * choices quietly expire.
 */

export type Intention = EquipmentType | 'Rest';

export const INTENTION_OPTIONS: readonly { value: Intention; label: string }[] = [
  { value: 'Treadmill', label: EQUIPMENT_LABELS.Treadmill },
  { value: 'IndoorBike', label: EQUIPMENT_LABELS.IndoorBike },
  { value: 'Elliptical', label: EQUIPMENT_LABELS.Elliptical },
  { value: 'Rest', label: 'Rest' },
];

export function intentionLabel(intention: Intention): string {
  return intention === 'Rest' ? 'Rest' : EQUIPMENT_LABELS[intention];
}

const INTENTION_PREFIX = 'sh.intention.';
const MOVEMENT_DISMISSED_PREFIX = 'sh.movement.dismissed.';

export function readIntention(dateIso: string): Intention | null {
  try {
    const value = localStorage.getItem(INTENTION_PREFIX + dateIso);
    return value && INTENTION_OPTIONS.some((o) => o.value === value) ? (value as Intention) : null;
  } catch {
    return null;
  }
}

export function writeIntention(dateIso: string, intention: Intention): void {
  try {
    localStorage.setItem(INTENTION_PREFIX + dateIso, intention);
  } catch {
    // Storage unavailable — the in-memory signal still carries the day.
  }
}

/** Evening movement nudge: "Not tonight" is an equal-calm choice, kept for the day only. */
export function isMovementDismissed(dateIso: string): boolean {
  try {
    return localStorage.getItem(MOVEMENT_DISMISSED_PREFIX + dateIso) === '1';
  } catch {
    return false;
  }
}

export function dismissMovement(dateIso: string): void {
  try {
    localStorage.setItem(MOVEMENT_DISMISSED_PREFIX + dateIso, '1');
  } catch {
    // Storage unavailable; the dismissal just won't survive a reload.
  }
}
