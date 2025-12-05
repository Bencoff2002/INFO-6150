import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('[AuthGuard] Checking access to:', state.url);
    console.log('[AuthGuard] Is authenticated:', authService.isAuthenticated());

    if (!authService.isAuthenticated()) {
        console.log('[AuthGuard] Not authenticated - redirecting to login');
        // Not authenticated - redirect to login
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    const currentUser = authService.getCurrentUser();
    console.log('[AuthGuard] Current user:', currentUser?.email, 'isBlocked:', currentUser?.isBlocked);

    // Authenticated - validate user status from server
    return authService.validateUserStatus().pipe(
        tap(isValid => console.log('[AuthGuard] Validation result:', isValid)),
        map(isValid => {
            if (!isValid) {
                console.log('[AuthGuard] User is blocked or invalid - redirecting to login');
                // User is blocked or invalid - redirect to login
                router.navigate(['/login'], {
                    queryParams: { returnUrl: state.url, blocked: 'true' }
                });
                return false;
            }
            console.log('[AuthGuard] Access granted');
            return true;
        })
    );
};
