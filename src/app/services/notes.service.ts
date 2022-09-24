import { NoteI, UpdateKeyI } from './../interfaces/notes';
import { Injectable } from '@angular/core';
import { liveQuery } from 'dexie';
import { db } from '../db/db'
@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor() { }

  notesList$ = liveQuery(() => db.notes.toArray())

  async add(noteObj: NoteI) {
    try {
      return await db.notes.add(noteObj)
    } catch (error) {
      console.log(error)
      return -1
    }
  }

  update(object: NoteI, id: number) {
    if (id !== -1) {
      try {
        db.notes.update(id, object)
      } catch (error) {
        console.log(error)
      }
    }
  }

  updateKey(object: UpdateKeyI, id: number) {
    if (id !== -1) {
      try {
        db.notes.update(id, object)
      } catch (error) {
        console.log(error)
      }
    }
  }

  async get(id: number) {
    if (id !== -1) {
      let noteData = await db.notes.where({ id: id }).toArray()
      return noteData[0]
    } else return {} as NoteI

  }

  async clone(id: number) {
    if (id !== -1) {
      try {
        let object = await db.notes.where({ id: id }).toArray()
        delete object[0].id
        this.add(object[0])
      } catch (error) {
        console.log(error)
      }
    }
  }

  delete(id: number) {
    if (id !== -1) {
      try {
        db.notes.delete(id)
      } catch (error) {
        console.log(error)
      }
    }
  }

  updateAllLabels(labelId: number, labelValue: string) {
    //how i miss relational databases here 😟
    try {
      db.transaction('rw', db.notes, () => {
        try {
          db.notes.each(el => {
            db.notes.where('id').equals(el.id!).modify((note: NoteI) => {
              if (labelValue === '') {
                let i = note.labels.findIndex(x => x.id === labelId)
                note.labels.splice(i, 1)
              } else {
                let label = note.labels.find(x => x.id === labelId)
                if (label) label.name = labelValue
              }
            })
          })
        } catch (error) {
          console.log(error)
        }
      })

    } catch (error) {
      console.log(error)
    }
  }

}

