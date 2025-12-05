import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
    @Input() searchTerm: string = '';
    @Input() loading: boolean = false;
    @Input() user: any;
    @Output() search = new EventEmitter<void>();
    @Output() logout = new EventEmitter<void>();

    setSearchTerm(term: string) {
        this.searchTerm = term;
    }

    handleSearch() {
        this.search.emit();
    }

    handleLogout() {
        this.logout.emit();
    }
}
