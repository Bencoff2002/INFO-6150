import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
    @Input() searchTerm: string = '';
    @Input() loading: boolean = false;
    @Output() search = new EventEmitter<string>();
    @Output() searchTermChange = new EventEmitter<string>();

    user: any = null;
    userMenuOpen = false;
    dashboardMenuOpen = false;
    reportsMenuOpen = false;
    adminMenuOpen = false;
    notificationsMenuOpen = false;
    isDarkMode = false;

    notifications: Notification[] = [];
    unreadCount = 0;
    private validationInterval: any;

    constructor(
        private authService: AuthService,
        private router: Router,
        private elementRef: ElementRef,
        public themeService: ThemeService,
        private cdr: ChangeDetectorRef,
        private notificationService: NotificationService
    ) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            console.log('[Navbar] User updated:', user?.email, 'isBlocked:', user?.isBlocked);
            this.user = user;
            this.cdr.detectChanges();
        });

        // Subscribe to notifications
        this.notificationService.notifications$.subscribe(notifications => {
            this.notifications = notifications;
            this.cdr.detectChanges();
        });

        this.notificationService.unreadCount$.subscribe(count => {
            this.unreadCount = count;
            this.cdr.detectChanges();
        });

        // Subscribe to theme changes
        this.themeService.isDarkMode$.subscribe(isDark => {
            this.isDarkMode = isDark;
        });

        // Periodically validate user status to catch blocks in real-time
        if (this.authService.isAuthenticated()) {
            console.log('[Navbar] Starting periodic validation check (every 30 seconds)');
            this.validationInterval = setInterval(() => {
                console.log('[Navbar] Running periodic validation check');
                const currentUser = this.authService.getCurrentUser();
                this.authService.validateUserStatus().subscribe(isValid => {
                    console.log('[Navbar] Periodic check result:', isValid);
                    if (!isValid) {
                        if (currentUser?.isAdmin) {
                            console.log('[Navbar] Admin blocked/invalid - redirecting to login');
                            this.router.navigate(['/login'], {
                                queryParams: { blocked: 'true' }
                            });
                        } else {
                            console.log('[Navbar] User blocked/invalid - redirecting to guest page');
                            this.router.navigate(['/']);
                        }
                    }
                });
            }, 30000); // Check every 30 seconds
        }
    }

    ngOnDestroy() {
        if (this.validationInterval) {
            console.log('[Navbar] Clearing validation interval');
            clearInterval(this.validationInterval);
        }
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    toggleNotificationsMenu() {
        this.notificationsMenuOpen = !this.notificationsMenuOpen;
        if (this.notificationsMenuOpen) {
            this.userMenuOpen = false;
            this.dashboardMenuOpen = false;
            this.reportsMenuOpen = false;
            this.adminMenuOpen = false;
        }
    }

    handleNotificationClick(notification: Notification) {
        this.notificationService.markAsRead(notification.id);
        this.notificationsMenuOpen = false;
        this.router.navigate(['/shared', notification.recipeId]);
    }

    markAllAsRead() {
        if (this.user) {
            this.notificationService.markAllAsRead(this.user.id);
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
            this.notificationsMenuOpen = false;
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
