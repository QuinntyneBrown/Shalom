import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PillarCard } from 'components';

/**
 * People pillar — placeholder page. The full design lands later from the
 * .pen file.
 */
@Component({
  selector: 'app-people',
  standalone: true,
  imports: [PillarCard],
  templateUrl: './people.page.html',
  styleUrl: './people.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeoplePage {}
