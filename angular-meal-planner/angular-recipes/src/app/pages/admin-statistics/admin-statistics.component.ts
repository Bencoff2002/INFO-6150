import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-admin-statistics',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-statistics.component.html',
    styleUrls: ['./admin-statistics.component.scss']
})
export class AdminStatisticsComponent implements OnInit {
    loading = false;
    error: string | null = null;
    currentDate = new Date();

    totalUsers = 0;
    totalFavorites = 0;
    totalMealPlans = 0;
    totalMyRecipes = 0;
    totalSharedRecipes = 0;
    totalRatings = 0;
    totalComments = 0;
    totalExternalRecipes = 0;

    private baseUrl = 'http://localhost:5001';

    constructor(
        private http: HttpClient,
        private location: Location,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadAllStatistics();
    }

    goBack() {
        this.location.back();
    }

    loadAllStatistics() {
        this.loading = true;
        this.error = null;

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
            ),
            myRecipes: this.http.get<any[]>(`${this.baseUrl}/myRecipes`).pipe(
                timeout(10000),
                catchError(() => of([]))
            ),
            sharedRecipes: this.http.get<any[]>(`${this.baseUrl}/sharedRecipes`).pipe(
                timeout(10000),
                catchError(() => of([]))
            ),
            ratings: this.http.get<any[]>(`${this.baseUrl}/ratings`).pipe(
                timeout(10000),
                catchError(() => of([]))
            ),
            comments: this.http.get<any[]>(`${this.baseUrl}/comments`).pipe(
                timeout(10000),
                catchError(() => of([]))
            ),
            externalRecipes: this.http.get<any[]>(`${this.baseUrl}/externalRecipes`).pipe(
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
                this.totalUsers = data.users?.length || 0;
                this.totalFavorites = data.favorites?.length || 0;
                this.totalMealPlans = data.mealPlans?.length || 0;
                this.totalMyRecipes = data.myRecipes?.length || 0;
                this.totalSharedRecipes = data.sharedRecipes?.length || 0;
                this.totalRatings = data.ratings?.length || 0;
                this.totalComments = data.comments?.length || 0;
                this.totalExternalRecipes = data.externalRecipes?.length || 0;
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'Failed to load statistics. Please ensure the server is running.';
                this.cdr.detectChanges();
            }
        });
    }
}
