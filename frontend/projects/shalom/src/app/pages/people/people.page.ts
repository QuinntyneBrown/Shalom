import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ConnectionNudgeDto,
  PEOPLE_SERVICE,
  PersonDto,
  TODAY_SERVICE,
  TodayPeopleDto,
} from 'api';

import { PersonDialog } from '../../dialogs/person.dialog';
import { SheetOpener } from '../../dialogs/sheet';
import {
  initialOf,
  personCaption,
  smsHref,
  telHref,
} from '../../shared/people-format';

/**
 * People pillar (design 14): "Today's nudge" card and the circle list.
 *
 * The nudge comes from the Today aggregate — the SERVER picks at most one
 * per day and suppresses it entirely once anyone was contacted today
 * (ADR-004; relationships are invitations, never obligations — no
 * "overdue", no badges, no streaks here). Done records the contact, "Not
 * today" snoozes until tomorrow; both then refetch the derived state.
 */
@Component({
  selector: 'app-people',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './people.page.html',
  styleUrl: './people.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeoplePage implements OnInit {
  private readonly peopleApi = inject(PEOPLE_SERVICE);
  private readonly todayApi = inject(TODAY_SERVICE);
  private readonly sheets = inject(SheetOpener);

  protected readonly people = signal<PersonDto[]>([]);
  protected readonly todayPeople = signal<TodayPeopleDto | null>(null);
  /** Server-derived local today (`yyyy-MM-dd`) — never computed client-side (ADR-004). */
  protected readonly serverToday = signal<string | null>(null);
  protected readonly loaded = signal(false);
  protected readonly acting = signal(false);

  protected readonly nudge = computed(() => this.todayPeople()?.nudge ?? null);

  ngOnInit(): void {
    void this.load();
  }

  protected initial(person: PersonDto): string {
    return initialOf(person.name);
  }

  protected caption(person: PersonDto): string {
    const today = this.serverToday();
    return today ? personCaption(person.relationship, person.lastContactedOn, today) : '';
  }

  protected connectedToday(person: PersonDto): boolean {
    const today = this.serverToday();
    return today !== null && person.lastContactedOn === today;
  }

  protected smsHref(nudge: ConnectionNudgeDto): string {
    return smsHref(nudge.phone ?? '', nudge.name);
  }

  protected telHref(nudge: ConnectionNudgeDto): string {
    return telHref(nudge.phone ?? '');
  }

  protected async done(nudge: ConnectionNudgeDto): Promise<void> {
    if (this.acting()) return;
    this.acting.set(true);
    try {
      await this.peopleApi.recordContact(nudge.personId);
      await this.load();
    } finally {
      this.acting.set(false);
    }
  }

  protected async notToday(nudge: ConnectionNudgeDto): Promise<void> {
    if (this.acting()) return;
    this.acting.set(true);
    try {
      await this.peopleApi.snooze(nudge.personId);
      await this.load();
    } finally {
      this.acting.set(false);
    }
  }

  protected openAddSheet(): void {
    const ref = this.sheets.open<PersonDto | undefined>(PersonDialog);
    ref.closed.subscribe((saved) => {
      if (saved) void this.load();
    });
  }

  private async load(): Promise<void> {
    const [people, today] = await Promise.all([
      this.peopleApi.list(),
      this.todayApi.getToday(),
    ]);
    this.people.set(people);
    this.todayPeople.set(today.people);
    this.serverToday.set(today.date);
    this.loaded.set(true);
  }
}
