import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap, tap, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    createdAt: string;
    totalTimeSpent: number;
    lastActive: string | null;
    lastPing: string | null;
    active: boolean;
    preferences: string[];
    isAdmin: boolean;
    isBlocked?: boolean;
    wasAdmin?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private baseUrl = environment.jsonServerUrl;
    private userSubject = new BehaviorSubject<User | null>(null);
    public user$ = this.userSubject.asObservable();

    constructor() {
        // Check local storage for existing session
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                console.log('[AuthService] Constructor - Found saved user:', user.email, 'isBlocked:', user.isBlocked);

                // Validate user status from server immediately
                this.http.get<User>(`${this.baseUrl}/users/${user.id}`).pipe(
                    catchError((error) => {
                        console.error('[AuthService] Constructor - Error validating saved user:', error);
                        localStorage.removeItem('user');
                        return of(null);
                    })
                ).subscribe(serverUser => {
                    if (serverUser) {
                        console.log('[AuthService] Constructor - Server user:', serverUser.email, 'isBlocked:', serverUser.isBlocked);
                        if (serverUser.isBlocked) {
                            console.log('[AuthService] Constructor - User is BLOCKED, clearing session');
                            localStorage.removeItem('user');
                            this.userSubject.next(null);
                        } else {
                            console.log('[AuthService] Constructor - User is valid, loading session');
                            this.userSubject.next(serverUser);
                            localStorage.setItem('user', JSON.stringify(serverUser));
                        }
                    } else {
                        console.log('[AuthService] Constructor - No server user found, clearing session');
                        this.userSubject.next(null);
                    }
                });
            } catch (e) {
                console.error('[AuthService] Constructor - Error parsing saved user:', e);
                localStorage.removeItem('user');
            }
        } else {
            console.log('[AuthService] Constructor - No saved user found');
        }
    }

    login(credentials: { email: string; password: string }): Observable<User> {
        console.log('[AuthService] Login attempt for:', credentials.email);
        const startTime = Date.now();

        // Find user by email with timeout
        return this.http.get<User[]>(`${this.baseUrl}/users?email=${credentials.email}`).pipe(
            timeout(5000), // 5 second timeout for faster response
            map(users => {
                const responseTime = Date.now() - startTime;
                console.log('[AuthService] Login response received in', responseTime, 'ms');

                if (users.length === 0) {
                    throw new Error('Invalid email or password');
                }

                const user = users[0];
                console.log('[AuthService] User found:', user.email, 'isBlocked:', user.isBlocked);

                // Check if user is blocked FIRST - before password check for faster response
                if (user.isBlocked) {
                    console.log('[AuthService] BLOCKED USER - denying access immediately');
                    throw new Error('Your account has been blocked. Please contact the administrator.');
                }

                // Verify password (client-side for dev purposes)
                if (user.password !== credentials.password) {
                    throw new Error('Invalid email or password');
                }

                return user;
            }),
            tap(user => {
                console.log('[AuthService] Login successful, setting session for:', user.email);
                this.userSubject.next(user);
                localStorage.setItem('user', JSON.stringify(user));
            }),
            catchError(error => {
                console.error('[AuthService] Login error:', error.message);
                if (error.message) {
                    return throwError(() => error);
                }
                return throwError(() => new Error('Login failed. Please try again.'));
            })
        );
    }

    register(userData: { name: string; email: string; password: string; preferences: string[] }): Observable<User> {
        console.log('[AuthService] Starting registration for:', userData.email);
        // First check if email already exists
        return this.http.get<User[]>(`${this.baseUrl}/users?email=${userData.email}`).pipe(
            tap(users => console.log('[AuthService] Email check result:', users.length === 0 ? 'Email available' : 'Email taken')),
            switchMap(users => { // Use switchMap to switch to a new observable stream
                if (users.length > 0) {
                    return throwError(() => new Error('Email already registered'));
                }

                // Generate unique ID (timestamp + random string)
                const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

                // Create new user object
                const newUser: User = {
                    id,
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                    preferences: userData.preferences || [],
                    createdAt: new Date().toISOString(),
                    totalTimeSpent: 0,
                    lastActive: null,
                    lastPing: null,
                    active: false,
                    isAdmin: false
                };

                console.log('[AuthService] Posting new user to database:', newUser);
                // POST new user to JSON server
                return this.http.post<User>(`${this.baseUrl}/users`, newUser).pipe(
                    tap(createdUser => {
                        console.log('[AuthService] User created in database:', createdUser);
                        this.userSubject.next(createdUser);
                        localStorage.setItem('user', JSON.stringify(createdUser));
                    })
                );
            }),
            catchError(error => {
                console.error('[AuthService] Registration error:', error);
                if (error.message) {
                    return throwError(() => error);
                }
                return throwError(() => new Error('Registration failed. Please try again.'));
            })
        );
    }

    logout() {
        this.userSubject.next(null);
        localStorage.removeItem('user');
    }

    isAuthenticated(): boolean {
        return !!this.userSubject.value;
    }

    getCurrentUser(): User | null {
        return this.userSubject.value;
    }

    updateUser(user: User) {
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
    }

    // Validate current user status from server
    validateUserStatus(): Observable<boolean> {
        const currentUser = this.getCurrentUser();
        console.log('[AuthService] validateUserStatus - Current user:', currentUser?.email, currentUser?.id);

        if (!currentUser) {
            console.log('[AuthService] validateUserStatus - No current user');
            return of(false);
        }

        console.log('[AuthService] validateUserStatus - Fetching user from server:', currentUser.id);
        return this.http.get<User>(`${this.baseUrl}/users/${currentUser.id}`).pipe(
            map(user => {
                console.log('[AuthService] validateUserStatus - Server response:', user.email, 'isBlocked:', user.isBlocked);
                // Check if user is blocked
                if (user.isBlocked) {
                    console.log('[AuthService] validateUserStatus - User is BLOCKED, logging out');
                    this.logout();
                    return false;
                }
                // Update local user data with latest from server
                console.log('[AuthService] validateUserStatus - User is valid, updating local data');
                this.updateUser(user);
                return true;
            }),
            catchError((error) => {
                // If user not found or error, logout
                console.error('[AuthService] validateUserStatus - Error fetching user:', error);
                this.logout();
                return of(false);
            })
        );
    }
}
