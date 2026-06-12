import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PillarCard } from 'components';

/**
 * Today pillar — placeholder page. The full design lands later from the
 * .pen file.
 */
@Component({
  selector: 'app-today',
  standalone: true,
  imports: [PillarCard],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayPage {}
