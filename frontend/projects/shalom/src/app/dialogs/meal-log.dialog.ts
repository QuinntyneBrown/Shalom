import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { MEAL_TAGS, MEALS_SERVICE, MealEntryDto, MealTag } from 'api';

/**
 * "Log a meal" bottom sheet (design 13): free text + tag chips from the
 * fixed vocabulary. No calories. Just patterns. (Photo upload is a later
 * milestone.)
 */
@Component({
  selector: 'app-meal-log-dialog',
  standalone: true,
  templateUrl: './meal-log.dialog.html',
  styleUrl: './meal-log.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealLogDialog {
  private readonly meals = inject(MEALS_SERVICE);
  private readonly ref = inject<DialogRef<MealEntryDto | undefined>>(DialogRef);

  protected readonly allTags = MEAL_TAGS;
  protected readonly text = signal('');
  protected readonly tags = signal<readonly MealTag[]>([]);
  protected readonly saving = signal(false);

  protected readonly canSave = computed(
    () => this.text().trim().length > 0 && !this.saving(),
  );

  protected toggleTag(tag: MealTag): void {
    this.tags.update((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  protected isSelected(tag: MealTag): boolean {
    return this.tags().includes(tag);
  }

  protected onTextInput(event: Event): void {
    this.text.set((event.target as HTMLInputElement).value);
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    try {
      const saved = await this.meals.log({
        text: this.text().trim(),
        tags: [...this.tags()],
      });
      this.ref.close(saved);
    } finally {
      this.saving.set(false);
    }
  }
}
