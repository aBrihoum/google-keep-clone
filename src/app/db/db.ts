import { LabelI } from '../interfaces/labels';
import Dexie, { Table } from 'dexie';
import { NoteI } from '../interfaces/notes';

class AppDB extends Dexie {
    notes!: Table<NoteI, number>
    labels!: Table<LabelI, number>
    constructor() {
        super('brihoum_gk');
        this.version(2).stores({ notes: "++id", labels: "++id,&name" })
    }
}

export const db = new AppDB()