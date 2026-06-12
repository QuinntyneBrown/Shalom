import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { AddImportantDateRequest } from '../models/add-important-date-request';
import { ConnectionNudgeDto } from '../models/connection-nudge-dto';
import { ImportantDateDto } from '../models/important-date-dto';
import { PersonDetailDto } from '../models/person-detail-dto';
import { PersonDto } from '../models/person-dto';
import { SavePersonRequest } from '../models/save-person-request';
import { IPeopleService } from './people.service.contract';

/**
 * Real HTTP `IPeopleService`. Bound to `PEOPLE_SERVICE` in the application
 * composition root.
 */
@Injectable({ providedIn: 'root' })
export class PeopleService implements IPeopleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Promise<PersonDto[]> {
    return firstValueFrom(
      this.http.get<PersonDto[]>(`${this.baseUrl}/api/people`),
    );
  }

  get(id: string): Promise<PersonDetailDto> {
    return firstValueFrom(
      this.http.get<PersonDetailDto>(`${this.baseUrl}/api/people/${id}`),
    );
  }

  create(req: SavePersonRequest): Promise<PersonDto> {
    return firstValueFrom(
      this.http.post<PersonDto>(`${this.baseUrl}/api/people`, req),
    );
  }

  update(id: string, req: SavePersonRequest): Promise<PersonDto> {
    return firstValueFrom(
      this.http.put<PersonDto>(`${this.baseUrl}/api/people/${id}`, req),
    );
  }

  archive(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/api/people/${id}`),
    );
  }

  recordContact(id: string): Promise<PersonDto> {
    return firstValueFrom(
      this.http.post<PersonDto>(`${this.baseUrl}/api/people/${id}/contact`, {}),
    );
  }

  snooze(id: string): Promise<PersonDto> {
    return firstValueFrom(
      this.http.post<PersonDto>(`${this.baseUrl}/api/people/${id}/snooze`, {}),
    );
  }

  nudges(): Promise<ConnectionNudgeDto[]> {
    return firstValueFrom(
      this.http.get<ConnectionNudgeDto[]>(`${this.baseUrl}/api/people/nudges`),
    );
  }

  addDate(personId: string, req: AddImportantDateRequest): Promise<ImportantDateDto> {
    return firstValueFrom(
      this.http.post<ImportantDateDto>(`${this.baseUrl}/api/people/${personId}/dates`, req),
    );
  }

  removeDate(dateId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/api/important-dates/${dateId}`),
    );
  }
}
