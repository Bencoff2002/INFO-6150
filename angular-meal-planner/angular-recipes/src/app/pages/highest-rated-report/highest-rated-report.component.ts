import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-highest-rated-report',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './highest-rated-report.component.html',
    styleUrls: ['./highest-rated-report.component.scss']
})
export class HighestRatedReportComponent implements OnInit {
    loading = false;
    error: string | null = null;
    currentDate = new Date();

    ratedRecipes: Array<{
        recipeId: string;
        recipeTitle: string;
        avgRating: number;
        ratingCount: number
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
        this.ratedRecipes = [];

        this.http.get<any[]>(`${this.baseUrl}/ratings`)
            .pipe(
                timeout(10000),
                catchError(() => {
                    this.error = 'Failed to load ratings data. Please ensure the server is running.';
                    return of([]);
                }),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (ratings) => {
                    if (ratings && ratings.length > 0) {
                        this.processRatings(ratings);
                    } else {
                        this.ratedRecipes = [];
                    }
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.error = 'Failed to load ratings data';
                    this.cdr.detectChanges();
                }
            });
    }

    private processRatings(ratings: any[]) {
        const recipeRatings: Map<string, { sum: number; count: number; title: string }> = new Map();

        ratings.forEach((rating: any) => {
            const recipeId = String(rating.recipeId || '');
            const stars = rating.stars || 0;
            const title = rating.recipeTitle || rating.recipe?.title || `Recipe ${recipeId}`;

            if (recipeId && stars > 0) {
                if (recipeRatings.has(recipeId)) {
                    const existing = recipeRatings.get(recipeId)!;
                    recipeRatings.set(recipeId, {
                        sum: existing.sum + stars,
                        count: existing.count + 1,
                        title: existing.title
                    });
                } else {
                    recipeRatings.set(recipeId, { sum: stars, count: 1, title });
                }
            }
        });

        const allRatedRecipes = Array.from(recipeRatings.entries())
            .map(([recipeId, data]) => ({
                recipeId,
                recipeTitle: data.title,
                avgRating: data.sum / data.count,
                ratingCount: data.count
            }))
            .sort((a, b) => {
                if (Math.abs(b.avgRating - a.avgRating) < 0.001) {
                    return b.ratingCount - a.ratingCount;
                }
                return b.avgRating - a.avgRating;
            });

        this.ratedRecipes = allRatedRecipes;
    }

    exportToCSV() {
        const headers = ['Rank', 'Recipe Name', 'Average Rating', 'Total Reviews'];
        const data = this.ratedRecipes.map((recipe, index) => [
            index + 1,
            recipe.recipeTitle,
            recipe.avgRating.toFixed(1),
            recipe.ratingCount
        ]);

        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `rated-recipes-${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToPDF() {
        window.print();
    }
}
