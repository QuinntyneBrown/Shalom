import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

export interface ConfirmData {
  title: string;
  /** Grace-forward copy — never guilt ("Fast ends here. Tonight starts fresh."). */
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

/**
 * Small confirmation sheet (CDK Dialog). Closes with `true` on confirm,
 * `undefined` otherwise.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm.dialog.html',
  styleUrl: './confirm.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  private readonly ref = inject<DialogRef<boolean | undefined>>(DialogRef);
  protected readonly data = inject<ConfirmData>(DIALOG_DATA);

  protected confirm(): void {
    this.ref.close(true);
  }

  protected cancel(): void {
    this.ref.close();
  }
}
