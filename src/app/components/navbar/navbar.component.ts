import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  constructor(private Shared: SharedService) { }

  @ViewChild("form23zSaZ") form23zSaZ?: ElementRef<HTMLDivElement>

  closeSideBar() { this.Shared.closeSideBar.next(true) }

  refresh() { window.location.reload() }

  view() {
    this.Shared.noteViewType.value === 'grid' ? this.Shared.noteViewType.next('list') : this.Shared.noteViewType.next('grid')
  }

  ngOnInit(): void { }


}
