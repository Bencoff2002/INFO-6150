import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('[AdminGuard] Checking admin access');

    const currentUser = authService.getCurrentUser();
    console.log('[AdminGuard] Current user:', currentUser?.email, 'isAdmin:', currentUser?.isAdmin, 'isBlocked:', currentUser?.isBlocked);

    if (!currentUser) {
        console.log('[AdminGuard] No current user - redirecting to login');
        router.navigate(['/login']);
        return of(false);
    }

    // Validate user status from server to check if blocked
    return authService.validateUserStatus().pipe(
        tap(isValid => console.log('[AdminGuard] Validation result:', isValid)),
        switchMap(isValid => {
            if (!isValid) {
                console.log('[AdminGuard] User is blocked - redirecting to login');
                router.navigate(['/login'], {
                    queryParams: { blocked: 'true' }
                });
                return of(false);
            }

            // Get fresh user data after validation
            const user = authService.getCurrentUser();
            console.log('[AdminGuard] Fresh user data:', user?.email, 'isAdmin:', user?.isAdmin);

            if (user?.isAdmin) {
                console.log('[AdminGuard] Admin access granted');
                return of(true);
            }

            console.log('[AdminGuard] Not an admin - redirecting to home');
            router.navigate(['/']);
            return of(false);
        })
    );
};
