import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService, User } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-edit-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, NavbarComponent],
    templateUrl: './edit-profile.component.html',
    styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {
    user: User | null = null;
    name: string = '';
    email: string = '';
    loading: boolean = false;
    error: string | null = null;
    success: string | null = null;

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
            this.name = user.name;
            this.email = user.email;
        });
    }

    async handleSubmit() {
        if (!this.user) return;

        this.loading = true;
        this.error = null;
        this.success = null;

        // Validation
        if (!this.name.trim()) {
            this.error = 'Name is required';
            this.loading = false;
            return;
        }

        if (!this.email.trim() || !this.email.includes('@')) {
            this.error = 'Valid email is required';
            this.loading = false;
            return;
        }

        try {
            // Check if email is already taken by another user
            if (this.email !== this.user.email) {
                const existingUsers: User[] = await this.http.get<User[]>(
                    `${this.baseUrl}/users?email=${this.email}`
                ).toPromise() || [];

                if (existingUsers.length > 0) {
                    this.error = 'Email is already in use';
                    this.loading = false;
                    return;
                }
            }

            // Update user
            const updatedUser = {
                ...this.user,
                name: this.name.trim(),
                email: this.email.trim()
            };

            await this.http.patch<User>(
                `${this.baseUrl}/users/${this.user.id}`,
                updatedUser
            ).toPromise();

            // Update local storage and auth service
            this.authService.updateUser(updatedUser);

            this.success = 'Profile updated successfully!';

            setTimeout(() => {
                this.router.navigate(['/']);
            }, 1500);
        } catch (err) {
            this.error = 'Failed to update profile. Please try again.';
            console.error('Profile update error:', err);
        } finally {
            this.loading = false;
        }
    }

    goBack() {
        window.history.back();
    }
}
