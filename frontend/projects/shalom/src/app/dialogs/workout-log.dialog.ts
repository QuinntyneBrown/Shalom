import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  EQUIPMENT_LABELS,
  EquipmentType,
  WORKOUTS_SERVICE,
  WorkoutDto,
} from 'api';

export interface WorkoutLogData {
  /** Pre-selected machine (the chip the user tapped), or null for the add button. */
  equipment: EquipmentType | null;
}

export type Effort = 'easy' | 'steady' | 'strong';

/**
 * "Log a workout" bottom sheet (design 12): machine chips, a ±5-minute
 * duration stepper, effort chips, optional note.
 *
 * Effort mapping: the Workout entity has no dedicated effort column, so the
 * chosen word is stored as an `effort:<word>` prefix on Notes (e.g.
 * "effort:steady · felt good") — the simplest honest mapping; a dedicated
 * field can be migrated in later without losing data.
 */
@Component({
  selector: 'app-workout-log-dialog',
  standalone: true,
  templateUrl: './workout-log.dialog.html',
  styleUrl: './workout-log.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutLogDialog {
  private readonly workouts = inject(WORKOUTS_SERVICE);
  private readonly ref = inject<DialogRef<WorkoutDto | undefined>>(DialogRef);
  private readonly data = inject<WorkoutLogData>(DIALOG_DATA);

  protected readonly machines: readonly EquipmentType[] = [
    'Treadmill',
    'IndoorBike',
    'Elliptical',
    'OutdoorWalk',
    'OutdoorRun',
  ];
  protected readonly labels = EQUIPMENT_LABELS;
  protected readonly efforts: readonly Effort[] = ['easy', 'steady', 'strong'];

  protected readonly equipment = signal<EquipmentType>(this.data.equipment ?? 'Treadmill');
  protected readonly duration = signal(25);
  protected readonly effort = signal<Effort>('steady');
  protected readonly note = signal('');
  protected readonly saving = signal(false);

  protected readonly canSave = computed(() => !this.saving());

  protected selectMachine(machine: EquipmentType): void {
    this.equipment.set(machine);
  }

  protected selectEffort(effort: Effort): void {
    this.effort.set(effort);
  }

  protected step(delta: number): void {
    this.duration.update((d) => Math.min(180, Math.max(5, d + delta)));
  }

  protected onNoteInput(event: Event): void {
    this.note.set((event.target as HTMLInputElement).value);
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const note = this.note().trim();
      const saved = await this.workouts.log({
        equipment: this.equipment(),
        durationMinutes: this.duration(),
        notes: note ? `effort:${this.effort()} · ${note}` : `effort:${this.effort()}`,
      });
      this.ref.close(saved);
    } finally {
      this.saving.set(false);
    }
  }
}
