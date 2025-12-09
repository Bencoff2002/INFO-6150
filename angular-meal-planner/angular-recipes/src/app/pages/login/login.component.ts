import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom, Subscription } from 'rxjs';

import { MessageDialogComponent } from '../../components/message-dialog/message-dialog.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MessageDialogComponent], // Import MessageDialogComponent
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm: FormGroup;
    isLogin = true;
    loading = false;
    error: string = '';
    showErrorDialog = false; // Add dialog state
    showPasswordChangePrompt = false;
    isBlockedUser = false;
    private routerSubscription: Subscription | null = null;
    private lockoutInterval: any;
    fromPage: string | null = null;

    // ... existing properties ...

    // ... existing methods ...



    closeErrorDialog() {
        this.showErrorDialog = false;
        this.error = ''; // Optionally clear error when dialog closes
    }

    // ... (rest of class) ...
    // Lockout state
    isLocked = false;
    lockoutEndTime: number | null = null;
    remainingTime = 0;

    preferenceOptions = [
        { value: 'vegetarian', label: 'Vegetarian' },
        { value: 'vegan', label: 'Vegan' },
        { value: 'glutenFree', label: 'Gluten Free' },
        { value: 'dairyFree', label: 'Dairy Free' }
    ];


    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            name: [''],
            preferences: [[]]
        });
    }

    ngOnInit() {
        try {
            console.log('[LoginComponent] ===== INIT START =====');
            console.log('[LoginComponent] AuthService.isAuthenticated():', this.authService.isAuthenticated());

            // Monitor navigation events to debug redirects
            this.routerSubscription = this.router.events.subscribe(event => {
                if (event instanceof NavigationStart) {
                    console.log('[LoginComponent] NavigationStart detected:', event.url);
                    console.log('[LoginComponent] Navigation trigger:', event.navigationTrigger);
                    console.log('[LoginComponent] Restored state:', event.restoredState);
                }
            });

            // Check for existing lockout
            const email = this.loginForm.get('email')?.value;
            if (email) {
                this.checkLockout(email);
            }

            // Check navigation state and query params
            const state = history.state;
            console.log('[LoginComponent] History state:', state);
            this.fromPage = state?.from || this.route.snapshot.queryParams['returnUrl'] || null;
            console.log('[LoginComponent] fromPage:', this.fromPage);

            // Monitor email changes to check lockout status
            this.loginForm.get('email')?.valueChanges.subscribe(email => {
                // console.log('[LoginComponent] Email changed:', email); // Too noisy
                this.checkLockout(email);
            });
            console.log('[LoginComponent] ===== INIT COMPLETE =====');
        } catch (e) {
            console.error('[LoginComponent] CRITICAL ERROR IN NGONINIT:', e);
            // Don't re-throw, to avoid crashing the route
        }
    }

    ngOnDestroy() {
        console.log('[LoginComponent] ===== DESTROY =====');
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
        if (this.lockoutInterval) {
            clearInterval(this.lockoutInterval);
        }
    }

    checkLockout(email: string) {
        if (!email) return;

        // Clear existing interval if any
        if (this.lockoutInterval) {
            clearInterval(this.lockoutInterval);
        }

        const lockoutEndStr = localStorage.getItem(`lockoutEnd_${email}`);
        if (lockoutEndStr) {
            const lockoutEnd = parseInt(lockoutEndStr, 10);
            if (lockoutEnd > Date.now()) {
                console.log('[LoginComponent] Account is locked until:', new Date(lockoutEnd).toLocaleTimeString());
                this.isLocked = true;
                this.lockoutEndTime = lockoutEnd;
                this.updateRemainingTime();
                this.cdr.detectChanges(); // Force update immediately

                // Start timer
                this.lockoutInterval = setInterval(() => {
                    this.updateRemainingTime();
                    this.cdr.detectChanges(); // Force update on every tick

                    if (!this.isLocked) {
                        console.log('[LoginComponent] Lockout expired');
                        clearInterval(this.lockoutInterval);
                        this.showPasswordChangePrompt = true;
                        this.cdr.detectChanges();
                    }
                }, 1000);
            } else {
                console.log('[LoginComponent] Lockout expired (checked on load)');
                localStorage.removeItem(`lockoutEnd_${email}`);
                this.isLocked = false;
            }
        }
    }

    updateRemainingTime() {
        if (this.lockoutEndTime) {
            const remaining = Math.ceil((this.lockoutEndTime - Date.now()) / 1000);
            console.log('[LoginComponent] Remaining time:', remaining);
            if (remaining > 0) {
                this.remainingTime = remaining;
            } else {
                this.isLocked = false;
                this.lockoutEndTime = null;
                this.remainingTime = 0;
            }
        }
    }

    formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    toggleMode() {
        this.isLogin = !this.isLogin;
        this.error = '';
        if (!this.isLogin) {
            this.loginForm.get('name')?.setValidators(Validators.required);
        } else {
            this.loginForm.get('name')?.clearValidators();
        }
        this.loginForm.get('name')?.updateValueAndValidity();
    }

    isPreferenceSelected(value: string): boolean {
        const prefs = this.loginForm.get('preferences')?.value || [];
        return prefs.includes(value);
    }

    handlePreferenceToggle(value: string) {
        const currentPrefs = this.loginForm.get('preferences')?.value || [];
        const index = currentPrefs.indexOf(value);
        if (index === -1) {
            this.loginForm.patchValue({ preferences: [...currentPrefs, value] });
        } else {
            this.loginForm.patchValue({ preferences: currentPrefs.filter((p: string) => p !== value) });
        }
    }

    async handleSubmit() {
        console.log('[LoginComponent] ===== HANDLE SUBMIT CALLED =====')
        console.log('[LoginComponent] Form valid:', this.loginForm.valid);
        console.log('[LoginComponent] isLogin:', this.isLogin);
        console.log('[LoginComponent] Current error:', this.error);
        console.log('[LoginComponent] Current loading:', this.loading);

        if (this.loginForm.invalid) {
            console.log('[LoginComponent] Form invalid, returning');
            return;
        }

        console.log('[LoginComponent] Setting loading to true, clearing error');
        this.loading = true;
        this.error = '';
        this.showErrorDialog = false; // Reset dialog
        const formData = this.loginForm.value;
        console.log('[LoginComponent] Form data email:', formData.email);

        try {
            if (this.isLogin) {
                const email = formData.email;
                const attemptsKey = `loginAttempts_${email}`;

                try {
                    // Attempt login with actual API
                    console.log('[LoginComponent] ===== STARTING LOGIN API CALL =====');
                    console.log('[LoginComponent] Attempting login for:', formData.email);
                    console.log('[LoginComponent] Calling authService.login()');

                    const user = await firstValueFrom(this.authService.login({ email: formData.email, password: formData.password }));

                    console.log('[LoginComponent] ===== LOGIN API CALL SUCCEEDED =====');
                    console.log('[LoginComponent] User:', user.email, 'isAdmin:', user.isAdmin, 'isBlocked:', user.isBlocked);

                    // Success - clear failed attempts
                    localStorage.removeItem(attemptsKey);

                    // Navigate based on user role
                    let redirectTo: string;
                    console.warn('[LoginComponent] Debugging Redirect Logic:');
                    console.warn('[LoginComponent] - User isAdmin:', user.isAdmin);
                    console.warn('[LoginComponent] - fromPage:', this.fromPage);
                    console.warn('[LoginComponent] - fromPage startsWith /admin:', this.fromPage?.startsWith('/admin'));
                    console.warn('[LoginComponent] - fromPage startsWith /dashboard:', this.fromPage?.startsWith('/dashboard'));

                    if (user && user.isAdmin) {
                        // Admin user - redirect to home page
                        console.warn('[LoginComponent] - Redirect Decision: Admin -> /');
                        redirectTo = '/';
                    } else {
                        // Regular user - use fromPage if it's safe, otherwise default to /home (User Dashboard)
                        // Avoid redirecting to admin pages
                        if (this.fromPage && !this.fromPage.startsWith('/admin') && !this.fromPage.startsWith('/dashboard') && this.fromPage !== '/' && this.fromPage !== '/login') {
                            console.warn('[LoginComponent] - Redirect Decision: Regular User -> using fromPage:', this.fromPage);
                            redirectTo = this.fromPage;
                        } else {
                            console.warn('[LoginComponent] - Redirect Decision: Regular User -> default to /home');
                            redirectTo = '/home';
                        }
                    }
                    console.warn('[LoginComponent] Final Redirect Target:', redirectTo);

                    // Verify auth state before navigating
                    const currentUser = this.authService.getCurrentUser();
                    console.log('[LoginComponent] Pre-navigation Auth Check:', currentUser?.email);

                    this.router.navigate([redirectTo], { replaceUrl: true });

                } catch (loginError: any) {
                    console.log('[LoginComponent] ===== LOGIN ERROR CAUGHT =====');
                    console.log('[LoginComponent] Error object:', loginError);
                    console.log('[LoginComponent] Error message:', loginError.message);
                    console.log('[LoginComponent] Error type:', typeof loginError.message);

                    // Check if this is a blocked user error
                    const isBlockedError = loginError.message && loginError.message.includes('blocked');
                    console.log('[LoginComponent] Is blocked error?', isBlockedError);

                    if (isBlockedError) {
                        console.log('[LoginComponent] ===== BLOCKED USER DETECTED =====');
                        console.log('[LoginComponent] Before setting - loading:', this.loading, 'error:', this.error);

                        // Clear failed login attempts and lockout for blocked user
                        console.log('[LoginComponent] Clearing login attempts and lockout for blocked user');
                        localStorage.removeItem(attemptsKey);
                        localStorage.removeItem(`lockoutEnd_${email}`);
                        this.isLocked = false;
                        this.lockoutEndTime = null;
                        this.remainingTime = 0;

                        // IMPORTANT: Clear any session to prevent app from redirecting
                        console.log('[LoginComponent] Clearing user session to prevent redirects');
                        this.authService.logout();

                        // Set blocked flag
                        this.isBlockedUser = true;

                        // Stop loading immediately and show error
                        this.loading = false;
                        this.error = loginError.message;
                        this.showErrorDialog = true; // Show dialog for blocked user too

                        console.log('[LoginComponent] After setting - loading:', this.loading, 'error:', this.error);
                        console.log('[LoginComponent] Error message length:', this.error ? this.error.length : 0);
                        console.log('[LoginComponent] isBlockedUser flag set to:', this.isBlockedUser);

                        // Force Angular to detect changes and update the UI
                        console.log('[LoginComponent] Forcing change detection');
                        this.cdr.detectChanges();

                        // Visual confirmation for debugging
                        console.log('[LoginComponent] DOM should now show error message');
                        console.log('[LoginComponent] Error will display for 5 seconds before redirect');
                        console.log('[LoginComponent] Current time:', new Date().toLocaleTimeString());

                        // Wait 5 seconds to show the error, then redirect to guest page
                        setTimeout(() => {
                            console.log('[LoginComponent] === 5 SECONDS ELAPSED ===');
                            console.log('[LoginComponent] Redirect time:', new Date().toLocaleTimeString());
                            console.log('[LoginComponent] Clearing error and redirecting to guest home page');
                            this.error = '';
                            this.isBlockedUser = false;
                            this.showErrorDialog = false; // Close dialog
                            this.router.navigate(['/'], { replaceUrl: true });
                        }, 5000);

                        console.log('[LoginComponent] Blocked error handler complete, staying on login page to show message');
                        return;
                    }

                    console.log('[LoginComponent] Not a blocked error, continuing with normal error handling');

                    // Login failed - track attempts
                    const attempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10);
                    const newAttempts = attempts + 1;
                    localStorage.setItem(attemptsKey, newAttempts.toString());

                    if (newAttempts >= 3) {
                        const lockoutEnd = Date.now() + 120000; // 2 minutes
                        localStorage.setItem(`lockoutEnd_${email}`, lockoutEnd.toString());
                        this.checkLockout(email);
                        throw new Error('Too many failed attempts. Account locked for 2 minutes.');
                    }

                    throw loginError;
                }
            } else {
                // Registration - wait for the entire observable chain to complete
                console.log('[LoginComponent] Starting registration...');
                const user = await firstValueFrom(this.authService.register({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    preferences: formData.preferences || []
                }));
                console.log('[LoginComponent] Registration completed, user:', user);

                // Navigate only after registration completes
                const redirectTo = this.fromPage || '/';
                this.router.navigate([redirectTo], { replaceUrl: true });
            }

        } catch (e: any) {
            console.log('[LoginComponent] ===== OUTER CATCH BLOCK =====');
            console.log('[LoginComponent] Outer error:', e);
            console.log('[LoginComponent] Outer error message:', e.message);

            // Check for invalid credentials error
            // Use includes to be safer against minor variations
            if (e.message && (e.message === 'Invalid email or password' || e.message.includes('Invalid email'))) {
                console.log('[LoginComponent] Detected invalid credentials error');

                // Calculate remaining attempts
                const email = formData.email;
                const attempts = parseInt(localStorage.getItem(`loginAttempts_${email}`) || '0', 10);
                const remaining = 3 - attempts;

                this.error = `Your email or password is incorrect. (You have ${remaining} attempt${remaining === 1 ? '' : 's'} left)`;
                this.showErrorDialog = true;
                this.cdr.detectChanges(); // Force update

                console.log('[LoginComponent] Error dialog visible, staying on page to allow retry');

                // User requested to NOT redirect to guest page on login failure
                // so they can retry entering the password.
            } else {
                console.log('[LoginComponent] Generic error handler');
                this.error = e.message || 'An error occurred';
                this.showErrorDialog = true;
                this.cdr.detectChanges(); // Force update
            }

            console.log('[LoginComponent] Error set in outer catch:', this.error);
        } finally {
            console.log('[LoginComponent] ===== FINALLY BLOCK =====');
            console.log('[LoginComponent] isBlockedUser flag:', this.isBlockedUser);
            console.log('[LoginComponent] Current error before finally:', this.error);
            console.log('[LoginComponent] Current loading before finally:', this.loading);

            // Only set loading to false if not a blocked user (already handled)
            if (!this.isBlockedUser) {
                console.log('[LoginComponent] Not blocked user, setting loading to false');
                this.loading = false;
            } else {
                console.log('[LoginComponent] Blocked user - keeping loading state as is');
            }

            console.log('[LoginComponent] Loading is now:', this.loading);
            console.log('[LoginComponent] Error is now:', this.error);
        }
    }

    handlePasswordChangeYes() {
        this.showPasswordChangePrompt = false;
        this.router.navigate(['/change-password']);
    }

    handlePasswordChangeNo() {
        this.showPasswordChangePrompt = false;
        // Proceed with normal navigation
        const redirectTo = this.fromPage || '/';
        this.router.navigate([redirectTo], { replaceUrl: true });
    }
}
