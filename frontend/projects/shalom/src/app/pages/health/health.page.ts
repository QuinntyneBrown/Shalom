import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PillarCard } from 'components';

/**
 * Health pillar — placeholder page. The full design lands later from the
 * .pen file.
 */
@Component({
  selector: 'app-health',
  standalone: true,
  imports: [PillarCard],
  templateUrl: './health.page.html',
  styleUrl: './health.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthPage {}
