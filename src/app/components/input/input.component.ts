import { NoteI, CheckboxI } from '../../interfaces/notes';
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, Input } from '@angular/core';
import { bgImages, bgColors } from 'src/app/interfaces/tooltip';
import { SharedService } from 'src/app/services/shared.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { LabelI } from 'src/app/interfaces/labels';
type InputLengthI = { title?: number, body?: number, cb?: number }
@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
  constructor(private cd: ChangeDetectorRef, public Shared: SharedService) { }

  @ViewChild("main") main!: ElementRef<HTMLDivElement>
  //? Placeholder  ----------------------------------------------------
  @ViewChild("notePlaceholder") notePlaceholder!: ElementRef<HTMLDivElement>
  //? note  -----------------------------------------------------
  @ViewChild("noteMain") noteMain!: ElementRef<HTMLDivElement>
  @ViewChild("noteContainer") noteContainer!: ElementRef<HTMLDivElement>
  @ViewChild("noteTitle") noteTitle!: ElementRef<HTMLDivElement>
  @ViewChild("noteBody") noteBody?: ElementRef<HTMLDivElement>
  @ViewChild("notePin") notePin!: ElementRef<HTMLDivElement>
  //? checkbox  -----------------------------------------------------
  @ViewChild("cboxInput") cboxInput!: ElementRef<HTMLDivElement>
  @ViewChild("cboxPh") cboxPh?: ElementRef<HTMLDivElement>
  @ViewChild("moreMenuTtBtn") moreMenuTtBtn?: ElementRef<HTMLDivElement> // needed in the html
  //? -----------------------------------------------------
  @Input() isEditing = false
  @Input() noteToEdit: NoteI = {} as NoteI
  //? -----------------------------------------------------
  checkBoxes: CheckboxI[] = []
  labels: LabelI[] = []
  isArchived = false
  isTrashed = false
  isCboxCompletedListCollapsed = false
  isCbox = new BehaviorSubject<boolean>(false)
  inputLength = new BehaviorSubject<InputLengthI>({ title: 0, body: 0, cb: 0 })
  //
  bgColors = bgColors
  bgImages = bgImages
  moreMenuEls = {
    delete: {
      disabled: true,
    },
    copy: {
      disabled: true,
    },
    checkbox: {
      value: 'Show checkboxes'
    },
  }
  //? placeholder  --------------------------------------------------

  toggleNoteVisibility(condition: boolean) {
    if (condition) {
      this.notePlaceholder.nativeElement.hidden = true; this.noteMain.nativeElement.hidden = false
    } else {
      this.notePlaceholder.nativeElement.hidden = false; this.noteMain.nativeElement.hidden = true
    }
  }

  notePhClick() {
    this.toggleNoteVisibility(true)
    if (this.isCbox.value) this.cboxPh?.nativeElement.focus()
    else this.noteBody?.nativeElement.focus()
    if (!this.isEditing) {
      this.inputLength.next({ title: 0, body: 0, cb: 0 })
      document.addEventListener('mousedown', this.mouseDownEvent)
    }
    this.labels = JSON.parse(JSON.stringify(this.Shared.label.list))
    /*
    the correct way is to use `mousedown` because : 
    https://www.javascripttutorial.net/javascript-dom/javascript-mouse-events/
    click & mouseup, wont get the job done.
    when u try to select a text, and you loose the click btn outside `notesContainer`,
    `closeNote()` will be called
    https://prnt.sc/Wu_19wKRAYig
    */
  }

  mouseDownEvent = (event: Event) => {
    if (this.isEditing) return
    let el = this.main.nativeElement
    let isTooltipOpen: any = document.querySelector('[data-is-tooltip-open="true"]')
    // if tooltip is open, we close is
    if (isTooltipOpen !== null) {
      if (!(el as any).contains(event.target) && !isTooltipOpen.contains(event.target)) { }
    }
    // else we close the note
    else if (!(el as any).contains(event.target)) {
      this.saveNote(); this.closeNote()
    }
  }

  closeNote() {
    this.toggleNoteVisibility(false)
    document.removeEventListener('mousedown', this.mouseDownEvent)
    this.reset()
  }

  //? note  -----------------------------------------------------

  async saveNote() {
    this.cboxInput?.nativeElement.blur()
    let noteObj: NoteI = {
      noteTitle: this.noteTitle.nativeElement.innerHTML,
      noteBody: this.noteBody?.nativeElement.innerHTML ? this.noteBody?.nativeElement.innerHTML : '',
      pinned: this.notePin.nativeElement.dataset['pinned'] === "true", // converting string to bool,
      bgColor: this.noteMain.nativeElement.style.backgroundColor,
      bgImage: this.noteContainer.nativeElement.style.backgroundImage,
      checkBoxes: this.checkBoxes,
      isCbox: this.isCbox.value,
      labels: this.labels.filter(x => x.added),
      archived: this.isArchived,
      trashed: this.isTrashed
    }
    if (noteObj.noteTitle.length || noteObj.noteBody && noteObj.noteBody?.length || this.checkBoxes.length) {
      if (this.isEditing) {
        this.Shared.note.db.update(noteObj)
        this.Shared.closeModal.next(true)
      } else {
        let id = await this.Shared.note.db.add(noteObj)
        if (this.isArchived) {
          this.Shared.snackBar({ action: 'archived', opposite: 'unarchived' }, { archived: false }, id)
        }
        if (this.isTrashed) {
          this.Shared.snackBar({ action: 'trashed', opposite: 'untrashed' }, { trashed: false }, id)
        }
        this.closeNote()
      }
    }
  }

  reset() {
    this.noteTitle.nativeElement.innerHTML = ''
    if (this.noteBody) this.noteBody.nativeElement.innerHTML = ''
    this.notePin.nativeElement.dataset['pinned'] = 'false'
    this.noteContainer.nativeElement.style.backgroundImage = ''
    this.noteMain.nativeElement.style.backgroundColor = ''
    this.noteMain.nativeElement.style.borderColor = ''
    //
    this.checkBoxes = []
    this.isCbox.next(false)
    this.isArchived = false
    this.isTrashed = false
    this.isCboxCompletedListCollapsed = false
    this.inputLength.next({ title: 0, body: 0, cb: 0 })
  }


  pasteEvent(event: ClipboardEvent) {
    // to remove text styling -> before : https://prnt.sc/a7M5g-kbofba, after : https://prnt.sc/D7KEV6rdlm_7
    event.preventDefault()
    let text = event.clipboardData?.getData('text/plain');
    let target = event.target as HTMLDivElement
    target.innerText += text
    let sel = window.getSelection()
    sel?.selectAllChildren(target)
    sel?.collapseToEnd()
    // document.execCommand('insertText', false, text)
    // ! TODO, when u paste, yji fel <br> => so ywali maybanch
  }


  //? checkboxes  --------------------------------------------------

  cboxPhKeyDown($event: KeyboardEvent) {
    $event.preventDefault()
    const isLetter = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"²^\\|,.<>\/?éèçµ]$/i.test($event.key)
    // ex : if he clicked the f1 btn for example, nothing would happen, otherwise : 
    if (!isLetter) return
    let enteredValue = $event.key
    this.addCheckBox(enteredValue) // a new checkbox will appear in the html
    this.cd.detectChanges()
    let el = document.querySelector(`[data-cbox-last="true"]`)
    // we move the cursor to the end, so the user will just continue what he typed before
    let sel = window.getSelection()
    if (el) sel?.selectAllChildren(el)
    sel?.collapseToEnd()
  }

  addCheckBox(data: string) {
    this.checkBoxes.push({
      done: false,
      data: data,
      id: this.checkBoxes.length
    })
    this.inputLength.next({ ...this.inputLength.value, cb: this.checkBoxes.length })
  }

  cBoxKeyDown($event: KeyboardEvent, id: number) {
    let target = $event.target as HTMLDivElement
    if ($event.key === 'Enter') {
      $event.preventDefault()
      this.cboxPh!.nativeElement.focus()
    }
    if ($event.key === 'Backspace' && target.innerText.length === 0) {
      this.cboxPh!.nativeElement.focus()
      this.cboxTools(id).remove()
    }
  }


  cboxTools(id: number) {
    let i = this.checkBoxes.findIndex(x => x.id === id)
    let actions = {
      remove: () => {
        this.checkBoxes.splice(i, 1)
        this.inputLength.next({ ...this.inputLength.value, cb: this.checkBoxes.length })
      },
      check: () => {
        this.checkBoxes[i].done = !this.checkBoxes[i].done
      },
      update: (el: HTMLDivElement) => {
        let elValue = el?.innerHTML
        this.checkBoxes[i].data = elValue
      }
    }
    return actions
  }

  //? isEditing  -----------------------------------------------------------

  innerData(note: NoteI) {
    this.notePhClick()
    this.noteTitle.nativeElement.innerHTML = note.noteTitle
    if (this.noteBody) this.noteBody.nativeElement.innerHTML = note.noteBody!
    this.notePin.nativeElement.dataset['pinned'] = String(note.pinned)
    this.noteContainer.nativeElement.style.backgroundImage = note.bgImage
    this.noteMain.nativeElement.style.backgroundColor = note.bgColor
    this.noteMain.nativeElement.style.borderColor = note.bgColor
    if (note.checkBoxes) this.checkBoxes = note.checkBoxes
    this.isCbox.next(note.isCbox)
    this.isArchived = note.archived
    this.isTrashed = note.trashed
    //
    this.inputLength.next({ title: note.noteTitle.length, body: note.noteBody ? note.noteBody?.length : 0, cb: note.checkBoxes?.length! })
    note.labels.forEach(noteLabel => {
      let label = this.labels.find(x => x.name === noteLabel.name)
      if (label) label.added = noteLabel.added
    })
    this.cd.detectChanges()
  }

  //? tooltip  -----------------------------------------------------------

  openTooltip(button: HTMLDivElement, tooltipEl: HTMLDivElement) {
    this.Shared.createTooltip(button, tooltipEl)
  }

  moreMenu(tooltipEl: HTMLDivElement) {
    let actions = {
      trash: () => {
        if (this.isEditing) {
          this.Shared.note.db.trash()
          this.Shared.closeModal.next(true)
        } else {
          this.isTrashed = true
          this.saveNote()
        }
      },
      clone: () => {
        this.saveNote()
      },
      toggleCbox: () => {
        this.isCbox.next(!this.isCbox.value)
      }
    }
    this.Shared.closeTooltip(tooltipEl)
    return actions
  }

  colorMenu = {
    bgColor: (data: bgColors) => {
      this.noteMain.nativeElement.style.backgroundColor = data
      this.noteMain.nativeElement.style.borderColor = data
    },
    bgImage: (data: bgImages) => {
      this.noteContainer.nativeElement.style.backgroundImage = `url(${data})`
    }
  }

  //?  -----------------------------------------------------------
  // cuz we don't have the spread operator in the template, we need to do this : 
  updateInputLength(type: InputLengthI) {
    if (type.title != undefined) this.inputLength.next({ ...this.inputLength.value, title: type.title })
    if (type.body != undefined) this.inputLength.next({ ...this.inputLength.value, body: type.body })
  }


  //? -----------------------------------------------------------

  saveNoteSubscription?: Subscription
  ngAfterViewInit() {
    if (this.isEditing) { this.saveNoteSubscription = this.Shared.saveNote.subscribe(x => { if (x) this.saveNote() }) }
    //? ----------------------------------------------------------------
    this.isCbox.subscribe(value => {
      if (value) this.moreMenuEls.checkbox.value = 'Hide checkboxes'
      else this.moreMenuEls.checkbox.value = 'Show checkboxes'
    })
    //? ----------------------------------------------------------------
    this.inputLength.subscribe(x => {
      if ((x.title) || (x.body) || (x.cb)) {
        this.moreMenuEls.delete.disabled = false
        this.moreMenuEls.copy.disabled = false
      } else {
        this.moreMenuEls.delete.disabled = true
        this.moreMenuEls.copy.disabled = true
      }
    })
    if (this.isEditing) {
      this.innerData(this.noteToEdit)
    }
  }

  ngOnInit(): void { }

  ngOnDestroy() { this.saveNoteSubscription?.unsubscribe() }

}
