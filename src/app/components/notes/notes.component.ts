import { CheckboxI, NoteI } from './../../interfaces/notes';
import { Component, OnInit, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
// @ts-ignore
import Bricks from 'bricks.js'
import { SharedService } from 'src/app/services/shared.service';
import { bgColors, bgImages } from 'src/app/interfaces/tooltip';
import { LabelI } from 'src/app/interfaces/labels';
import { ActivationEnd, NavigationEnd, Router } from '@angular/router';
@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
})
export class NotesComponent implements OnInit {
  constructor(public Shared: SharedService, private router: Router) { }

  @ViewChild("mainContainer") mainContainer!: ElementRef<HTMLInputElement>
  @ViewChild("modalContainer") modalContainer!: ElementRef<HTMLInputElement>
  @ViewChild("modal") modal!: ElementRef<HTMLInputElement>
  @ViewChildren('noteEl') noteEl!: QueryList<ElementRef<HTMLDivElement>>
  @ViewChildren('title') title!: QueryList<ElementRef<HTMLDivElement>>
  //? -----------------------------------------------------
  currentPage = {
    archive: false,
    trash: false,
    label: undefined
  }
  currentPageName = ''
  labels: LabelI[] = []
  bgColors = bgColors
  bgImages = bgImages
  noteWidth = 240
  clickedNoteData: NoteI = {} as NoteI
  //? -----------------------------------------------------
  trackBy(item: any) { return item.id }

  buildMasonry() {
    let gutter = 10
    let totalNoteWidth = this.noteWidth + gutter
    let containerWidth = this.mainContainer.nativeElement.clientWidth
    let numberOfColumns = 0
    let masonryWidth = '0px'
    // --
    if (this.Shared.noteViewType.value === 'grid') {
      this.noteWidth = 240
      numberOfColumns = Math.floor(containerWidth / totalNoteWidth)
    }
    else {
      if (this.mainContainer.nativeElement.clientWidth >= 600) this.noteWidth = 600
      else this.noteWidth = this.mainContainer.nativeElement.clientWidth - 10
      numberOfColumns = 1
    }
    document.documentElement.style.setProperty('--note-width', this.noteWidth + "px")
    // --
    const sizes = [{ columns: numberOfColumns, gutter: gutter }]
    this.noteEl.toArray().forEach(el => { brikcs(el.nativeElement); if (el.nativeElement.style.width) masonryWidth = el.nativeElement.style.width })
    function brikcs(node: HTMLDivElement) { const instance = Bricks({ container: node, packed: 'data-packed', sizes: sizes, position: false }); instance.pack() }
    window.onresize = () => { if (this.Shared.noteViewType.value === 'list') this.Shared.noteViewType.next('grid') }
    //? we align the titles to the masonry width
    this.title.forEach(el => {
      if (this.Shared.noteViewType.value === 'list') el.nativeElement.style.maxWidth = masonryWidth
      else el.nativeElement.style.maxWidth = ''
    })
  }

  //? modal  -----------------------------------------------------------

  openModal(clickedNote: HTMLDivElement, noteData: NoteI) {
    this.Shared.note.id = noteData.id!
    this.clickedNoteData = noteData
    this.clickedNoteEl = clickedNote
    let modalContainer = this.modalContainer.nativeElement
    let modal = this.modal.nativeElement
    this.setModalStyling()
    setTimeout(() => { modal.removeAttribute("style") })
    clickedNote.classList.add('hide')
    modalContainer.style.display = 'block';
    document.addEventListener('mousedown', this.mouseDownEvent)
  }

  mouseDownEvent = (event: Event) => {
    let isTooltipOpen = document.querySelector('[data-is-tooltip-open="true"]')
    let modalEL = this.modal.nativeElement
    if (!(modalEL as any).contains(event.target)) {
      if (!isTooltipOpen) {
        this.Shared.saveNote.next(true)
        this.closeModal()
      }
    }
  }

  clickedNoteEl!: HTMLDivElement // needed in setModalStyling()
  closeModal() {
    document.removeEventListener('mousedown', this.mouseDownEvent)
    let modalContainer = this.modalContainer.nativeElement
    this.setModalStyling()
    setTimeout(() => {
      this.clickedNoteEl.classList.remove('hide')
      modalContainer.style.display = 'none'
    }, 300)
  }

  setModalStyling() {
    let bounding = this.clickedNoteEl.getBoundingClientRect()
    let modal = this.modal.nativeElement
    modal.style.transform = `translate(${bounding.x}px, ${bounding.y}px)`
    modal.style.width = bounding.width + 'px'
    modal.style.height = bounding.height + 'px'
    modal.style.top = `0`
    modal.style.left = `0`
  }

  //? checkbox  -----------------------------------------------------------

  checkBoxTools(note: NoteI, event: Event) {
    this.Shared.note.id = note.id!
    event?.stopPropagation()
    let actions = {
      check: (cb: CheckboxI) => {
        cb.done = !cb.done
      },
      remove: (cb: CheckboxI) => {
        let index = note.checkBoxes?.findIndex(x => x === cb)
        if (index !== undefined) note.checkBoxes?.splice(index, 1)
      }
    }
    this.Shared.note.db.updateKey({ checkBoxes: note.checkBoxes })
    return actions
  }

  //? pin note  -----------------------------------------------------------

  togglePin(noteId: number, pinned: boolean) {
    this.Shared.note.id = noteId
    pinned = !pinned
    this.Shared.note.db.updateKey({ pinned: pinned })
  }

  //? labels -------------------------------------------------------------

  removeLabel(note: NoteI, label: LabelI) {
    this.Shared.note.id = note.id!
    label.added = !label.added
    this.Shared.note.db.updateKey({ labels: note.labels })
  }
  //? tooltip  -----------------------------------------------------------

  Ttbutton?: HTMLDivElement // used in moreMenu.openLabelMenu
  openTooltip(button: HTMLDivElement, tooltipEl: HTMLDivElement, noteId: number) {
    this.Shared.note.id = noteId
    this.Ttbutton = button
    this.Shared.createTooltip(button, tooltipEl)
  }

  moreMenu(tooltipEl: HTMLDivElement) {
    let actions = {
      trash: () => {
        this.Shared.note.db.trash()
      },
      clone: () => {
        this.Shared.note.db.clone()
      },
      openLabelMenu: (tooltipEl: HTMLDivElement) => {
        this.labels = JSON.parse(JSON.stringify(this.Shared.label.list))
        this.Shared.createTooltip(this.Ttbutton!, tooltipEl)
        this.Shared.note.db.get().then(note => {
          note.labels.forEach(noteLabel => {
            let label = this.labels.find(x => x.name === noteLabel.name)
            if (label) label.added = noteLabel.added
          })
        })
      }
    }
    this.Shared.closeTooltip(tooltipEl)
    return actions
  }

  colorMenu = {
    bgColor: (data: bgColors) => {
      this.Shared.note.db.updateKey({ bgColor: data })
    },
    bgImage: (data: bgImages) => {
      this.Shared.note.db.updateKey({ bgImage: `url(${data})` })
    }
  }

  labelMenu(label: LabelI) {
    label.added = !label.added
    this.Shared.note.db.updateKey({ labels: this.labels })
  }

  // ? archive page

  toggleArchive(noteId: number, archived: boolean) {
    this.Shared.note.id = noteId
    archived = !archived
    this.Shared.note.db.updateKey({ archived: archived })
    let obj = archived ? { action: 'archived', opposite: 'unarchived' } : { action: 'unrchived', opposite: 'archived' }
    this.Shared.snackBar(obj, { archived: !archived }, noteId)
  }

  // ? trash page

  removeNote(noteId: number) {
    this.Shared.note.id = noteId
    this.Shared.note.db.delete()
  }

  restoreNote(noteId: number) {
    this.Shared.note.id = noteId
    this.Shared.note.db.updateKey({ trashed: false, archived: false })
    this.Shared.snackBar({ action: 'restored', opposite: 'trashed' }, { trashed: true }, noteId)
  }
  // ?--------------------------------------------------------------

  ngAfterViewChecked() {
    this.buildMasonry()

  }

  ngOnInit(): void {
    this.Shared.closeSideBar.subscribe(() => { setTimeout(() => { this.buildMasonry() }, 200) })
    this.Shared.closeModal.subscribe(x => { if (x) this.closeModal() })
    this.Shared.noteViewType.subscribe(() => { setTimeout(() => this.buildMasonry(), 300); })
    this.router.events.subscribe(url => {
      if (url instanceof NavigationEnd) {
        url.url.includes('archive') ? this.currentPage.archive = true : this.currentPage.archive = false
        url.url.includes('trash') ? this.currentPage.trash = true : this.currentPage.trash = false
      }
      else if (url instanceof ActivationEnd) {
        this.currentPage.label = url.snapshot.params['name']
      }
      this.currentPageName = this.currentPage.label ? this.currentPage.label : this.currentPage.archive ? 'archived' : (this.currentPage.trash ? 'trashed' : 'home')
    })
  }
}
