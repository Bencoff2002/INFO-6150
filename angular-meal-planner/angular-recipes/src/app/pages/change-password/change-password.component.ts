import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService, User } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [CommonModule, FormsModule, NavbarComponent],
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
    user: User | null = null;
    currentPassword: string = '';
    newPassword: string = '';
    confirmPassword: string = '';
    loading: boolean = false;
    error: string | null = null;
    success: string | null = null;
    showCurrentPassword: boolean = false;
    showNewPassword: boolean = false;
    showConfirmPassword: boolean = false;

    private baseUrl = environment.jsonServerUrl;

    constructor(
        private authService: AuthService,
        private router: Router,
        private http: HttpClient
    ) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            if (!user) {
                this.router.navigate(['/login']);
                return;
            }
            this.user = user;
        });
    }

    async handleSubmit() {
        if (!this.user) return;

        this.loading = true;
        this.error = null;
        this.success = null;

        // Validation
        if (!this.currentPassword) {
            this.error = 'Current password is required';
            this.loading = false;
            return;
        }

        if (this.currentPassword !== this.user.password) {
            this.error = 'Current password is incorrect';
            this.loading = false;
            return;
        }

        if (!this.newPassword || this.newPassword.length < 6) {
            this.error = 'New password must be at least 6 characters';
            this.loading = false;
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.error = 'New passwords do not match';
            this.loading = false;
            return;
        }

        if (this.newPassword === this.currentPassword) {
            this.error = 'New password must be different from current password';
            this.loading = false;
            return;
        }

        try {
            // Update password
            const updatedUser = {
                ...this.user,
                password: this.newPassword
            };

            await this.http.patch<User>(
                `${this.baseUrl}/users/${this.user.id}`,
                updatedUser
            ).toPromise();

            // Update local storage and auth service
            this.authService.updateUser(updatedUser);

            this.success = 'Password changed successfully!';

            // Clear form
            this.currentPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';

            setTimeout(() => {
                this.router.navigate(['/']);
            }, 1500);
        } catch (err) {
            this.error = 'Failed to change password. Please try again.';
            console.error('Password change error:', err);
        } finally {
            this.loading = false;
        }
    }

    togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
        if (field === 'current') {
            this.showCurrentPassword = !this.showCurrentPassword;
        } else if (field === 'new') {
            this.showNewPassword = !this.showNewPassword;
        } else {
            this.showConfirmPassword = !this.showConfirmPassword;
        }
    }

    goBack() {
        window.history.back();
    }
}
