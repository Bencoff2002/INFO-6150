import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export const userGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('[UserGuard] Checking user access');

    // Get current user synchronously first
    const currentUser = authService.getCurrentUser();
    console.log('[UserGuard] Current user:', currentUser?.email, 'isAdmin:', currentUser?.isAdmin, 'isBlocked:', currentUser?.isBlocked);

    if (!currentUser) {
        console.log('[UserGuard] No current user - session expired - redirecting to guest page');
        router.navigate(['/']);
        return false;
    }

    // Validate user status from server to check if blocked
    return authService.validateUserStatus().pipe(
        tap(isValid => console.log('[UserGuard] Validation result:', isValid)),
        switchMap(isValid => {
            if (!isValid) {
                const user = authService.getCurrentUser();
                if (user?.isAdmin) {
                    console.log('[UserGuard] Admin blocked/invalid - redirecting to login');
                    router.navigate(['/login'], {
                        queryParams: { blocked: 'true' }
                    });
                } else {
                    console.log('[UserGuard] User blocked/invalid - redirecting to guest page');
                    router.navigate(['/']);
                }
                return of(false);
            }

            // Get fresh user data after validation
            const user = authService.getCurrentUser();
            console.log('[UserGuard] Fresh user data:', user?.email, 'isAdmin:', user?.isAdmin);

            if (user?.isAdmin) {
                console.log('[UserGuard] Admin trying to access user page - redirecting to admin/users');
                router.navigate(['/admin/users']);
                return of(false);
            }

            console.log('[UserGuard] Access granted to regular user');
            return of(true);
        })
    );
};
