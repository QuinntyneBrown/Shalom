import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { GRATITUDE_SERVICE, GratitudeEntryDto } from 'api';

export interface GratitudeDialogData {
  /** Person the note is about, or absent for an unlinked note. */
  personId?: string | null;
}

/**
 * "Add a note" gratitude bottom sheet (design 15): one private line —
 * just between you and God. Closes with the saved GratitudeEntryDto.
 */
@Component({
  selector: 'app-gratitude-dialog',
  standalone: true,
  templateUrl: './gratitude.dialog.html',
  styleUrl: './gratitude.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GratitudeDialog {
  private readonly gratitude = inject(GRATITUDE_SERVICE);
  private readonly ref = inject<DialogRef<GratitudeEntryDto | undefined>>(DialogRef);
  private readonly data = inject<GratitudeDialogData>(DIALOG_DATA, { optional: true }) ?? {};

  protected readonly text = signal('');
  protected readonly saving = signal(false);

  protected readonly canSave = computed(
    () => this.text().trim().length > 0 && !this.saving(),
  );

  protected onTextInput(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    try {
      const saved = await this.gratitude.add({
        text: this.text().trim(),
        personId: this.data.personId ?? null,
      });
      this.ref.close(saved);
    } finally {
      this.saving.set(false);
    }
  }
}
