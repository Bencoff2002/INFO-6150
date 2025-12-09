import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App implements OnInit {
  protected readonly title = signal('angular-meal-planner');
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    console.log('[App] ===== APP COMPONENT INIT =====');
    console.log('[App] Current URL:', this.router.url);
    console.log('[App] Current time:', new Date().toLocaleTimeString());

    // Validate user on app startup
    if (this.authService.isAuthenticated()) {
      console.log('[App] User is authenticated, validating status');
      const currentUser = this.authService.getCurrentUser();
      console.log('[App] Current user:', currentUser?.email, 'isBlocked:', currentUser?.isBlocked);

      this.authService.validateUserStatus().subscribe(isValid => {
        console.log('[App] Initial validation result:', isValid);
        if (!isValid) {
          console.log('[App] User is blocked/invalid, redirecting to login with blocked=true');
          console.log('[App] Redirect time:', new Date().toLocaleTimeString());
          this.router.navigate(['/login'], {
            queryParams: { blocked: 'true' }
          });
        }
      });
    } else {
      console.log('[App] No authenticated user - no action needed');
    }
  }
}
