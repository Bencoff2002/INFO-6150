import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
    @Input() searchTerm: string = '';
    @Input() loading: boolean = false;
    @Output() search = new EventEmitter<string>();
    @Output() searchTermChange = new EventEmitter<string>();

    user: any = null;
    userMenuOpen = false;
    dashboardMenuOpen = false;
    reportsMenuOpen = false;
    adminMenuOpen = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private elementRef: ElementRef
    ) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
            console.log('[Navbar] User updated:', user?.email, 'isBlocked:', user?.isBlocked);
        });

        // Periodically validate user status to catch blocks in real-time
        if (this.authService.isAuthenticated()) {
            console.log('[Navbar] Starting periodic validation check (every 30 seconds)');
            setInterval(() => {
                console.log('[Navbar] Running periodic validation check');
                this.authService.validateUserStatus().subscribe(isValid => {
                    console.log('[Navbar] Periodic check result:', isValid);
                    if (!isValid) {
                        console.log('[Navbar] User is blocked - redirecting to login');
                        // User was blocked - redirect to login
                        this.router.navigate(['/login'], {
                            queryParams: { blocked: 'true' }
                        });
                    }
                });
            }, 30000); // Check every 30 seconds
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const targetElement = event.target as HTMLElement;
        // Close menus if clicking outside of the navbar
        if (!this.elementRef.nativeElement.contains(targetElement)) {
            this.userMenuOpen = false;
            this.dashboardMenuOpen = false;
            this.reportsMenuOpen = false;
            this.adminMenuOpen = false;
        }
    }

    setSearchTerm(term: string) {
        this.searchTerm = term;
        this.searchTermChange.emit(this.searchTerm);
    }

    onSearchTermChange() {
        this.searchTermChange.emit(this.searchTerm);
    }

    handleSearch() {
        if (this.searchTerm.trim()) {
            this.search.emit(this.searchTerm);
        }
    }

    toggleUserMenu() {
        this.userMenuOpen = !this.userMenuOpen;
        this.dashboardMenuOpen = false;
        this.reportsMenuOpen = false;
        this.adminMenuOpen = false;
    }

    toggleDashboardMenu() {
        this.dashboardMenuOpen = !this.dashboardMenuOpen;
        this.userMenuOpen = false;
        this.reportsMenuOpen = false;
        this.adminMenuOpen = false;
    }

    toggleReportsMenu() {
        this.reportsMenuOpen = !this.reportsMenuOpen;
        this.userMenuOpen = false;
        this.dashboardMenuOpen = false;
        this.adminMenuOpen = false;
    }

    toggleAdminMenu() {
        this.adminMenuOpen = !this.adminMenuOpen;
        this.userMenuOpen = false;
        this.dashboardMenuOpen = false;
        this.reportsMenuOpen = false;
    }

    navigateToDashboard(view: string) {
        this.dashboardMenuOpen = false;
        if (view === 'meal-planner') {
            this.router.navigate(['/meal-planner']);
        } else if (view === 'top-rated') {
            this.router.navigate(['/top-rated']);
        } else if (view === 'favorites') {
            this.router.navigate(['/favorites']);
        }
    }

    navigateToAdminSection(section: string) {
        this.adminMenuOpen = false;
        if (section === 'admin') {
            this.router.navigate(['/admin']);
        } else if (section === 'dashboard') {
            this.router.navigate(['/admin/dashboard']);
        } else if (section === 'all-users') {
            this.router.navigate(['/admin/users']);
        }
    }

    navigateToReport(reportType: string) {
        this.reportsMenuOpen = false;

        switch (reportType) {
            case 'rated':
                this.router.navigate(['/admin/reports/rated']);
                break;
            case 'viewed':
                this.router.navigate(['/admin/reports/viewed']);
                break;
            case 'user-activity':
                this.router.navigate(['/admin/reports/user-activity']);
                break;
            default:
                this.router.navigate(['/admin/reports']);
        }
    }

    navigateToReports() {
        this.router.navigate(['/admin/reports']);
    }

    navigateToStatistics() {
        // Navigate to statistics page
        this.router.navigate(['/admin/statistics']);
    }

    handleLogout() {
        console.log('[Navbar] ===== LOGOUT INITIATED =====');
        console.log('[Navbar] Current user:', this.user?.email);
        console.log('[Navbar] Is admin:', this.user?.isAdmin);

        const isAdmin = this.user?.isAdmin;

        console.log('[Navbar] Calling authService.logout()');
        this.authService.logout();
        this.userMenuOpen = false;

        console.log('[Navbar] Session cleared, redirecting...');

        // Redirect admin to login page, regular users to guest home page
        if (isAdmin) {
            console.log('[Navbar] Redirecting admin to login page');
            this.router.navigate(['/login']);
        } else {
            console.log('[Navbar] Redirecting user to guest home page (/)');
            this.router.navigate(['/']);
        }

        console.log('[Navbar] ===== LOGOUT COMPLETE =====');
    }

    navigateTo(path: string) {
        this.userMenuOpen = false;
        this.router.navigate([path]);
    }
}
