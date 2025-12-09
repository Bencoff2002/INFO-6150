import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Notification {
    id: string;
    recipientId: string;
    senderId: string;
    senderName: string;
    recipeId: string;
    recipeTitle: string;
    createdAt: string;
    isRead: boolean;
    type: 'shared_recipe';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private baseUrl = environment.jsonServerUrl;

    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();

    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    constructor() {
        // Poll for notifications every 30 seconds if user is logged in
        setInterval(() => {
            const user = this.authService.getCurrentUser();
            if (user) {
                this.loadNotifications(user.id);
            }
        }, 30000);

        // Also load on auth state change
        this.authService.user$.subscribe(user => {
            if (user) {
                this.loadNotifications(user.id);
            } else {
                this.notificationsSubject.next([]);
                this.unreadCountSubject.next(0);
            }
        });
    }

    async loadNotifications(userId: string): Promise<void> {
        try {
            const notifications = await this.http.get<Notification[]>(
                `${this.baseUrl}/notifications?recipientId=${userId}&_sort=createdAt&_order=desc`
            ).toPromise() || [];

            this.notificationsSubject.next(notifications);
            this.updateUnreadCount(notifications);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    }

    private updateUnreadCount(notifications: Notification[]) {
        const count = notifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(count);
    }

    async markAsRead(notificationId: string): Promise<void> {
        try {
            await this.http.patch(`${this.baseUrl}/notifications/${notificationId}`, { isRead: true }).toPromise();

            // Update local state
            const current = this.notificationsSubject.value;
            const updated = current.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
            this.notificationsSubject.next(updated);
            this.updateUnreadCount(updated);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    }

    async markAllAsRead(userId: string): Promise<void> {
        const unread = this.notificationsSubject.value.filter(n => !n.isRead);
        if (unread.length === 0) return;

        // Process in parallel
        const updates = unread.map(n =>
            this.http.patch(`${this.baseUrl}/notifications/${n.id}`, { isRead: true }).toPromise()
        );

        try {
            await Promise.all(updates);
            this.loadNotifications(userId);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    }

    async notifyAllUsers(notificationData: Omit<Notification, 'id' | 'recipientId' | 'createdAt' | 'isRead'>): Promise<void> {
        try {
            // 1. Get all users
            const users = await this.http.get<any[]>(`${this.baseUrl}/users`).toPromise() || [];

            // 2. Filter out the sender
            const recipients = users.filter(u => u.id !== notificationData.senderId);

            // 3. Create notifications for each recipient
            const notifications = recipients.map(recipient => ({
                ...notificationData,
                recipientId: recipient.id,
                createdAt: new Date().toISOString(),
                isRead: false,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Generate unique ID
            }));

            // 4. Post all notifications (sequentially or parallel)
            // Using Promise.all for parallel execution
            await Promise.all(notifications.map(n =>
                this.http.post(`${this.baseUrl}/notifications`, n).toPromise()
            ));

            console.log(`Sent notifications to ${recipients.length} users`);

        } catch (err) {
            console.error('Failed to notify users:', err);
            throw err;
        }
    }
}
