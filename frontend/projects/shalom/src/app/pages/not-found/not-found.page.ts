import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PillarCard } from 'components';

/**
 * Catch-all for unknown routes.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [PillarCard, RouterLink],
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
