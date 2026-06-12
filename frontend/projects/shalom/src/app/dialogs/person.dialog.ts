import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { PEOPLE_SERVICE, PersonDto } from 'api';

export interface PersonDialogData {
  /** Person to edit, or null/absent to add someone new. */
  person?: PersonDto | null;
}

/** Cadence choices offered in the sheet — gentle rhythms, never deadlines. */
export const CADENCE_OPTIONS = [
  { value: '', label: 'No rhythm — just keep them close' },
  { value: '7', label: 'Weekly' },
  { value: '14', label: 'Every two weeks' },
  { value: '30', label: 'Monthly' },
] as const;

/**
 * "Someone on your heart…" bottom sheet (design 14): name, relationship,
 * phone, and a contact-rhythm select. Doubles as the edit sheet from the
 * person detail page. Closes with the saved PersonDto.
 */
@Component({
  selector: 'app-person-dialog',
  standalone: true,
  templateUrl: './person.dialog.html',
  styleUrl: './person.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDialog {
  private readonly people = inject(PEOPLE_SERVICE);
  private readonly ref = inject<DialogRef<PersonDto | undefined>>(DialogRef);
  private readonly data = inject<PersonDialogData>(DIALOG_DATA, { optional: true }) ?? {};

  protected readonly editing: PersonDto | null = this.data.person ?? null;
  protected readonly cadences = CADENCE_OPTIONS;

  protected readonly name = signal(this.editing?.name ?? '');
  protected readonly relationship = signal(this.editing?.relationship ?? '');
  protected readonly phone = signal(this.editing?.phone ?? '');
  protected readonly cadence = signal(
    this.editing?.contactCadenceDays != null ? String(this.editing.contactCadenceDays) : '',
  );
  protected readonly saving = signal(false);

  protected readonly title = this.editing ? `Edit ${this.editing.name}` : 'Someone on your heart';
  protected readonly canSave = computed(
    () => this.name().trim().length > 0 && !this.saving(),
  );

  protected onInput(field: 'name' | 'relationship' | 'phone', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'name') this.name.set(value);
    else if (field === 'relationship') this.relationship.set(value);
    else this.phone.set(value);
  }

  protected onCadenceChange(event: Event): void {
    this.cadence.set((event.target as HTMLSelectElement).value);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    try {
      const req = {
        name: this.name().trim(),
        relationship: this.relationship().trim() || null,
        phone: this.phone().trim() || null,
        contactCadenceDays: this.cadence() ? Number(this.cadence()) : null,
        notes: this.editing?.notes ?? null,
      };
      const saved = this.editing
        ? await this.people.update(this.editing.id, req)
        : await this.people.create(req);
      this.ref.close(saved);
    } finally {
      this.saving.set(false);
    }
  }
}
