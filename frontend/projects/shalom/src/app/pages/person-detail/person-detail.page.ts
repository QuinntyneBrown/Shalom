import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  GRATITUDE_SERVICE,
  GratitudeEntryDto,
  ImportantDateDto,
  PEOPLE_SERVICE,
  PersonDetailDto,
} from 'api';

import { GratitudeDialog } from '../../dialogs/gratitude.dialog';
import { ImportantDateDialog, ImportantDateDialogData } from '../../dialogs/important-date.dialog';
import { PersonDialog, PersonDialogData } from '../../dialogs/person.dialog';
import { SheetOpener } from '../../dialogs/sheet';
import { toIsoDate } from '../../shared/health-format';
import {
  daysUntilLabel,
  initialOf,
  lastContactLabel,
  smsHref,
  telHref,
} from '../../shared/people-format';

/**
 * Person detail (design 15): identity block, Text/Call/Connected quick
 * actions, important dates (daysUntil derived server-side, ADR-004), and
 * the private gratitude card. "Recent prompts" is intentionally absent —
 * there is no prompt history table, and we show nothing rather than fake
 * it. No streaks, no overdue — relationships are invitations.
 */
@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './person-detail.page.html',
  styleUrl: './person-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDetailPage implements OnInit {
  private readonly peopleApi = inject(PEOPLE_SERVICE);
  private readonly gratitudeApi = inject(GRATITUDE_SERVICE);
  private readonly sheets = inject(SheetOpener);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly person = signal<PersonDetailDto | null>(null);
  protected readonly gratitude = signal<GratitudeEntryDto[]>([]);
  protected readonly acting = signal(false);

  protected readonly initial = computed(() => {
    const person = this.person();
    return person ? initialOf(person.name) : '';
  });

  /** Display-only caption; browser-local today (precedent: health page lines). */
  protected readonly lastContact = computed(() => {
    const person = this.person();
    return person ? lastContactLabel(person.lastContactedOn, toIsoDate(new Date())) : null;
  });

  protected readonly smsHref = computed(() => {
    const person = this.person();
    return person?.phone ? smsHref(person.phone, person.name) : null;
  });

  protected readonly telHref = computed(() => {
    const person = this.person();
    return person?.phone ? telHref(person.phone) : null;
  });

  ngOnInit(): void {
    void this.load();
  }

  protected whenLabel(date: ImportantDateDto): string {
    return daysUntilLabel(date.daysUntil);
  }

  protected async connected(): Promise<void> {
    const person = this.person();
    if (!person || this.acting()) return;
    this.acting.set(true);
    try {
      await this.peopleApi.recordContact(person.id);
      await this.loadPerson();
    } finally {
      this.acting.set(false);
    }
  }

  protected openEditSheet(): void {
    const person = this.person();
    if (!person) return;
    const ref = this.sheets.open<unknown, PersonDialogData>(PersonDialog, { person });
    ref.closed.subscribe((saved) => {
      if (saved) void this.loadPerson();
    });
  }

  protected openDateSheet(): void {
    const ref = this.sheets.open<ImportantDateDto | undefined, ImportantDateDialogData>(
      ImportantDateDialog, { personId: this.id });
    ref.closed.subscribe((saved) => {
      if (saved) void this.loadPerson();
    });
  }

  protected openGratitudeSheet(): void {
    const ref = this.sheets.open<GratitudeEntryDto | undefined>(
      GratitudeDialog, { personId: this.id });
    ref.closed.subscribe((saved) => {
      if (saved) this.gratitude.update((entries) => [saved, ...entries]);
    });
  }

  protected async removeDate(date: ImportantDateDto): Promise<void> {
    if (this.acting()) return;
    this.acting.set(true);
    try {
      await this.peopleApi.removeDate(date.id);
      await this.loadPerson();
    } finally {
      this.acting.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      const [person, gratitude] = await Promise.all([
        this.peopleApi.get(this.id),
        this.gratitudeApi.list(this.id),
      ]);
      this.person.set(person);
      this.gratitude.set(gratitude);
    } catch {
      // Archived or unknown — back to the list, quietly.
      await this.router.navigateByUrl('/people');
    }
  }

  private async loadPerson(): Promise<void> {
    this.person.set(await this.peopleApi.get(this.id));
  }
}
