import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';

/**
 * Opens a component as an iPhone-style bottom sheet (CDK Dialog under the
 * hood — CLAUDE.md: never hand-roll a modal). One place owns the position
 * strategy and sizing so every sheet behaves identically.
 */
@Injectable({ providedIn: 'root' })
export class SheetOpener {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);

  open<R, D = unknown>(component: ComponentType<unknown>, data?: D): DialogRef<R> {
    return this.dialog.open<R>(component, {
      data,
      width: 'min(100vw, 440px)',
      maxWidth: '100vw',
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .bottom('0'),
      panelClass: 'sh-sheet-pane',
    });
  }
}
