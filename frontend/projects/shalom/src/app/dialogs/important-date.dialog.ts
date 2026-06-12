import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ImportantDateDto, PEOPLE_SERVICE } from 'api';

export interface ImportantDateDialogData {
  personId: string;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * "Add a date" bottom sheet (design 15): label, month, day, optional year.
 * The lead window keeps the server default (7 days — "surfaced a week
 * early"). Closes with the saved ImportantDateDto.
 */
@Component({
  selector: 'app-important-date-dialog',
  standalone: true,
  templateUrl: './important-date.dialog.html',
  styleUrl: './important-date.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportantDateDialog {
  private readonly people = inject(PEOPLE_SERVICE);
  private readonly ref = inject<DialogRef<ImportantDateDto | undefined>>(DialogRef);
  private readonly data = inject<ImportantDateDialogData>(DIALOG_DATA);

  protected readonly months = MONTH_NAMES;

  protected readonly label = signal('');
  protected readonly month = signal(1);
  protected readonly day = signal('');
  protected readonly year = signal('');
  protected readonly saving = signal(false);

  protected readonly canSave = computed(() => {
    const day = Number(this.day());
    return (
      this.label().trim().length > 0 &&
      Number.isInteger(day) && day >= 1 && day <= 31 &&
      !this.saving()
    );
  });

  protected onLabelInput(event: Event): void {
    this.label.set((event.target as HTMLInputElement).value);
  }

  protected onMonthChange(event: Event): void {
    this.month.set(Number((event.target as HTMLSelectElement).value));
  }

  protected onDayInput(event: Event): void {
    this.day.set((event.target as HTMLInputElement).value);
  }

  protected onYearInput(event: Event): void {
    this.year.set((event.target as HTMLInputElement).value);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    try {
      const saved = await this.people.addDate(this.data.personId, {
        label: this.label().trim(),
        month: this.month(),
        day: Number(this.day()),
        year: this.year() ? Number(this.year()) : null,
      });
      this.ref.close(saved);
    } finally {
      this.saving.set(false);
    }
  }
}
