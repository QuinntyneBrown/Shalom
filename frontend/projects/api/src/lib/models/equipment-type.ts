/** Workout equipment as serialized by the API (enum names). */
export type EquipmentType = 'Treadmill' | 'IndoorBike' | 'Elliptical';

/** Display labels per equipment value (the design says "Bike", not "IndoorBike"). */
export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  Treadmill: 'Treadmill',
  IndoorBike: 'Bike',
  Elliptical: 'Elliptical',
};
