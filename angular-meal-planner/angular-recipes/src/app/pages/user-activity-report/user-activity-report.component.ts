import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

@Component({
    selector: 'app-user-activity-report',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-activity-report.component.html',
    styleUrls: ['./user-activity-report.component.scss']
})
export class UserActivityReportComponent implements OnInit {
    loading = false;
    error: string | null = null;
    currentDate = new Date();

    userActivities: Array<{
        userId: string;
        name: string;
        email: string;
        dateCreated: string;
        lastLogin: string;
        favoritesCount: number;
        mealPlansCount: number;
    }> = [];

    private baseUrl = 'http://localhost:5001';

    constructor(
        private http: HttpClient,
        private location: Location,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadReport();
    }

    goBack() {
        this.location.back();
    }

    loadReport() {
        if (this.loading) return;

        this.loading = true;
        this.error = null;
        this.userActivities = [];

        forkJoin({
            users: this.http.get<any[]>(`${this.baseUrl}/users`).pipe(
                timeout(10000),
                catchError(() => of([]))
            ),
            favorites: this.http.get<any[]>(`${this.baseUrl}/favorites`).pipe(
                timeout(10000),
                catchError(() => of([]))
            ),
            mealPlans: this.http.get<any[]>(`${this.baseUrl}/savedMealPlans`).pipe(
                timeout(10000),
                catchError(() => of([]))
            )
        }).pipe(
            finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (data) => {
                if (data.users && data.users.length > 0) {
                    this.processUsers(data.users, data.favorites, data.mealPlans);
                } else {
                    this.userActivities = [];
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'Failed to load user activity data. Please ensure the server is running.';
                this.cdr.detectChanges();
            }
        });
    }

    private processUsers(users: any[], favorites: any[], mealPlans: any[]) {
        const favoriteCounts = new Map<string, number>();
        const mealPlanCounts = new Map<string, number>();

        favorites.forEach((fav: any) => {
            const userId = String(fav.userId || '');
            if (userId) {
                favoriteCounts.set(userId, (favoriteCounts.get(userId) || 0) + 1);
            }
        });

        mealPlans.forEach((plan: any) => {
            const userId = String(plan.userId || '');
            if (userId) {
                mealPlanCounts.set(userId, (mealPlanCounts.get(userId) || 0) + 1);
            }
        });

        this.userActivities = users.map(user => {
            const userId = String(user.id || user._id || '');
            return {
                userId,
                name: user.name || 'Unknown',
                email: user.email || 'N/A',
                dateCreated: user.createdAt || 'N/A',
                lastLogin: user.lastActive || user.lastPing || 'Never',
                favoritesCount: favoriteCounts.get(userId) || 0,
                mealPlansCount: mealPlanCounts.get(userId) || 0
            };
        }).sort((a, b) => {
            const totalA = a.favoritesCount + a.mealPlansCount;
            const totalB = b.favoritesCount + b.mealPlansCount;
            return totalB - totalA;
        });
    }

    exportToCSV() {
        const headers = ['Name', 'Email', 'Created', 'Last Login', 'Favorites', 'Meal Plans'];
        const data = this.userActivities.map((user) => [
            user.name,
            user.email,
            user.dateCreated,
            user.lastLogin,
            user.favoritesCount,
            user.mealPlansCount
        ]);

        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `user-activity-${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToPDF() {
        window.print();
    }
}
