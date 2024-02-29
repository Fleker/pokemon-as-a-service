import { OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { ManagerService } from 'src/app/dialogs/manager.service';
import { Type } from '../../../../../shared/src/pokemon/types';
import { MoveId, MoveTypeMap } from '../../../../../shared/src/gen/type-move-meta';

@Component({
  selector: 'move-span',
  templateUrl: './move-span.component.html',
  styleUrls: ['./move-span.component.css']
})
export class MoveSpanComponent implements OnChanges {
  @Input('move') move?: MoveId | string
  type?: Type
  name?: string

  constructor(private dialogs: ManagerService) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.type = MoveTypeMap[this.move as MoveId]!.type as Type
    this.name = MoveTypeMap[this.move as MoveId]!.name
  }

  openDialog(): void {
    this.dialogs.openMovedex(this.move as MoveId)
  }
}
