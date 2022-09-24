import { Pipe, PipeTransform } from '@angular/core';
import { CheckboxI } from '../interfaces/notes';

@Pipe({
  name: 'cboxDone',
  pure: false
})
export class CboxDonePipe implements PipeTransform {

  transform(object: CheckboxI[], isDone: boolean): CheckboxI[] {
    if (isDone) return object.filter((x: any) => x.done === true)
    else return object.filter((x: any) => x.done === false)
  }

}
