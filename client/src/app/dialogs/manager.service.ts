import { ElementRef } from '@angular/core';
import { Injectable } from '@angular/core';
import { PokedexData, PokedexDialog } from './pokedex/pokedex.component';
import { MovedexComponent } from './movedex/movedex.component';
import { MoveId } from '../../../../shared/src/gen/type-move-meta';

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dialogDexWrapper?: ElementRef<any>
  private dialogDex?: PokedexDialog
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dialogMoveWrapper?: ElementRef<any>
  private dialogMove?: MovedexComponent

  constructor() { }

  init(
    dialog: ElementRef<HTMLDialogElement>,
    ddex: ElementRef<PokedexDialog>,
    dialogMoveWrapper: ElementRef<HTMLDialogElement>,
    dialogMove: ElementRef<MovedexComponent>,
  ) {
    this.dialogDexWrapper = dialog
    this.dialogDex = ddex as unknown as PokedexDialog
    this.dialogMoveWrapper = dialogMoveWrapper
    this.dialogMove = dialogMove as unknown as MovedexComponent
  }

  openPokedex(data: PokedexData, canTag: boolean, uncaught: boolean) {
    this.dialogDexWrapper!.nativeElement.showModal()
    this.dialogDex!.openDex(data.badge, canTag, uncaught)
  }

  closePokedex() {
    this.dialogDexWrapper!.nativeElement.close()
  }

  openMovedex(move: MoveId) {
    this.dialogMoveWrapper!.nativeElement.showModal()
    this.dialogMove!.openDialog(move)
  }

  closeMovedex() {
    this.dialogMoveWrapper!.nativeElement.close()
  }
}
