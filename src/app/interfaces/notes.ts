import { LabelI } from './labels';

export interface NoteI {
    id?: number
    noteTitle: string
    noteBody?: string
    pinned: boolean
    bgColor: string
    bgImage: string
    checkBoxes?: CheckboxI[]
    isCbox: boolean
    labels: LabelI[]
    archived: boolean
    trashed: boolean
}

export interface CheckboxI {
    done: boolean,
    data: any,
    id: number
}

export type UpdateKeyI = {
    [key in keyof NoteI]?: any
}

export interface NoteModelI {
    id: number
    pinned: NoteI[]
    unpinned: NoteI[]
    all: NoteI[]
    db: {
        add(data: NoteI): Promise<number>
        update(data: NoteI): void
        updateKey(object: UpdateKeyI): void
        updateAllLabels(labelId: number, labelValue: string): void
        get(): Promise<NoteI>
        clone(): void
        delete(): void
        trash(): void
    }
}
