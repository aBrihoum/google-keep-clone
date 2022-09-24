import { Pipe, PipeTransform } from '@angular/core';
import { NoteI } from '../interfaces/notes';

@Pipe({
  name: 'notesPinned'
})
export class NotesPinnedPipe implements PipeTransform {

  transform(object: NoteI[], pinned: boolean): NoteI[] {
    if (pinned) return object.filter(x => x.pinned === true)
    else return object.filter(x => x.pinned === false)
  }

}
