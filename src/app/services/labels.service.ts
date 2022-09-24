import { LabelI } from './../interfaces/labels';
import { Injectable } from '@angular/core';
import { liveQuery } from 'dexie';
import { db } from '../db/db'
@Injectable({
  providedIn: 'root'
})
export class LabelsService {

  constructor() { }

  labelsList$ = liveQuery(() => db.labels.toArray())

  async add(labelObj: LabelI) {
    return db.labels.add(labelObj)
  }

  delete(id: number) {
    try {
      db.labels.delete(id)
    } catch (error) {
      console.log(error)
    }
  }

  update(object: LabelI, id: number) {
    if (id !== -1) {
      try {
        db.labels.update(id, object)
      } catch (error) {
        console.log(error)
      }
    }
  }


}


