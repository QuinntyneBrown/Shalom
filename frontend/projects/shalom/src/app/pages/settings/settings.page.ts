import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PillarCard } from 'components';

/**
 * Settings — placeholder page. The full design lands later from the
 * .pen file.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [PillarCard],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {}
