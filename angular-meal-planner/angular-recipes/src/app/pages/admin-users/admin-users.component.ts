import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { timeout, catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    isAdmin?: boolean;
    isBlocked?: boolean;
    wasAdmin?: boolean;
}

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-users.component.html',
    styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit, OnDestroy {
    users: User[] = [];
    loading = false;
    error: string | null = null;
    currentDate = new Date();
    updatingUserId: string | null = null;
    openMenuUserId: string | null = null;
    private menuCloseTimer: any = null;
    menuPosition: { top: number; right: number } = { top: 0, right: 0 };

    private baseUrl = 'http://localhost:5001';

    constructor(
        private http: HttpClient,
        private location: Location,
        private cdr: ChangeDetectorRef
    ) {
        console.log('👤 AdminUsersComponent constructor called');
    } ngOnInit() {
        console.log('🔧 AdminUsersComponent ngOnInit called');
        console.log('Initial state:', {
            loading: this.loading,
            error: this.error,
            usersCount: this.users.length
        });
        this.loadUsers();
    }

    goBack() {
        this.location.back();
    }

    loadUsers() {
        this.loading = true;
        this.error = null;
        this.users = [];

        this.http.get<User[]>(`${this.baseUrl}/users`)
            .pipe(
                timeout(10000),
                catchError(() => {
                    this.error = 'Failed to load users. Please ensure the server is running.';
                    return of([]);
                }),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (users) => {
                    this.users = users || [];
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.error = 'Failed to load users';
                    this.cdr.detectChanges();
                }
            });
    }

    toggleMenu(userId: string, event: MouseEvent) {
        // Clear existing timer
        if (this.menuCloseTimer) {
            clearTimeout(this.menuCloseTimer);
            this.menuCloseTimer = null;
        }

        // Toggle menu
        const wasOpen = this.openMenuUserId === userId;
        this.openMenuUserId = wasOpen ? null : userId;

        // Calculate position if opening
        if (!wasOpen && this.openMenuUserId) {
            const button = event.currentTarget as HTMLElement;
            const rect = button.getBoundingClientRect();
            this.menuPosition = {
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right
            };

            // Set auto-close timer
            this.menuCloseTimer = setTimeout(() => {
                this.closeMenu();
                this.cdr.detectChanges();
            }, 5000);
        }
    }

    closeMenu() {
        if (this.menuCloseTimer) {
            clearTimeout(this.menuCloseTimer);
            this.menuCloseTimer = null;
        }
        this.openMenuUserId = null;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        // Close menu if click is outside the menu and not on the menu button
        if (this.openMenuUserId && !target.closest('.action-menu-container')) {
            this.closeMenu();
            this.cdr.detectChanges();
        }
    }

    ngOnDestroy() {
        if (this.menuCloseTimer) {
            clearTimeout(this.menuCloseTimer);
        }
    }

    grantAdminPrivilege(user: User) {
        this.closeMenu();
        if (!confirm(`Are you sure you want to grant admin privileges to ${user.name}?`)) return;

        // Optimistic update
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...user, isAdmin: true };
            this.cdr.detectChanges();
        }

        this.updateUser(user.id, { ...user, isAdmin: true });
    }

    revokeAdminPrivilege(user: User) {
        this.closeMenu();
        if (!confirm(`Are you sure you want to revoke admin privileges from ${user.name}?`)) return;

        // Optimistic update
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...user, isAdmin: false };
            this.cdr.detectChanges();
        }

        this.updateUser(user.id, { ...user, isAdmin: false });
    }

    deleteUser(user: User) {
        this.closeMenu();
        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;

        // Optimistic update - remove immediately
        this.users = this.users.filter(u => u.id !== user.id);
        this.cdr.detectChanges();

        this.http.delete(`${this.baseUrl}/users/${user.id}`)
            .pipe(
                timeout(10000),
                catchError((error) => {
                    alert(`Failed to delete user: ${error.message || 'Unknown error'}`);
                    // Reload on error to restore the user
                    this.loadUsers();
                    return of(null);
                })
            )
            .subscribe();
    }

    blockUser(user: User) {
        this.closeMenu();
        if (!confirm(`Are you sure you want to block ${user.name}?`)) return;

        // Optimistic update
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...user, isBlocked: true, wasAdmin: user.isAdmin, isAdmin: false };
            this.cdr.detectChanges();
        }

        this.updateUser(user.id, { ...user, isBlocked: true, wasAdmin: user.isAdmin, isAdmin: false });
    }

    reinstateUser(user: User) {
        this.closeMenu();
        if (!confirm(`Are you sure you want to reinstate ${user.name}?`)) return;

        // Optimistic update
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...user, isBlocked: false, isAdmin: user.wasAdmin || false, wasAdmin: undefined };
            this.cdr.detectChanges();
        }

        this.updateUser(user.id, { ...user, isBlocked: false, isAdmin: user.wasAdmin || false, wasAdmin: undefined });
    }

    private updateUser(userId: string, updatedUser: User) {
        this.http.put<User>(`${this.baseUrl}/users/${userId}`, updatedUser)
            .pipe(
                timeout(10000),
                catchError((error) => {
                    alert(`Failed to update user: ${error.message || 'Unknown error'}`);
                    // Reload on error to restore correct state
                    this.loadUsers();
                    return of(null);
                })
            )
            .subscribe();
    }

    trackByUserId(index: number, user: User): string {
        return user.id;
    }
}
