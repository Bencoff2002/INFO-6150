import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-viewed-recipes-report',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './viewed-recipes-report.component.html',
    styleUrls: ['./viewed-recipes-report.component.scss']
})
export class ViewedRecipesReportComponent implements OnInit {
    loading = false;
    error: string | null = null;
    currentDate = new Date();

    viewedRecipes: Array<{
        recipeId: string;
        recipeTitle: string;
        viewCount: number;
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
        this.viewedRecipes = [];

        this.http.get<any[]>(`${this.baseUrl}/favorites`)
            .pipe(
                timeout(10000),
                catchError(() => {
                    this.error = 'Failed to load viewed recipes data. Please ensure the server is running.';
                    return of([]);
                }),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (favorites) => {
                    if (favorites && favorites.length > 0) {
                        this.processFavorites(favorites);
                    } else {
                        this.viewedRecipes = [];
                    }
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.error = 'Failed to load viewed recipes data';
                    this.cdr.detectChanges();
                }
            });
    }

    private processFavorites(favorites: any[]) {
        const recipeViewCounts: Map<string, { count: number; title: string }> = new Map();

        favorites.forEach((fav: any) => {
            const recipeId = String(fav.recipeId || fav.recipe?.id || '');

            if (recipeId) {
                const recipeTitle =
                    fav.title ||
                    fav.recipeTitle ||
                    fav.recipe?.title ||
                    fav.recipe?.name ||
                    `Recipe ${recipeId}`;

                if (recipeViewCounts.has(recipeId)) {
                    const existing = recipeViewCounts.get(recipeId)!;
                    recipeViewCounts.set(recipeId, {
                        count: existing.count + 1,
                        title: existing.title
                    });
                } else {
                    recipeViewCounts.set(recipeId, {
                        count: 1,
                        title: recipeTitle
                    });
                }
            }
        });

        const allRecipes = Array.from(recipeViewCounts.entries())
            .sort((a, b) => b[1].count - a[1].count);

        this.viewedRecipes = allRecipes.map(([recipeId, data]) => ({
            recipeId: recipeId,
            recipeTitle: data.title,
            viewCount: data.count
        }));
    }

    exportToCSV() {
        const headers = ['Rank', 'Recipe Name', 'Views'];
        const data = this.viewedRecipes.map((recipe, index) => [
            index + 1,
            recipe.recipeTitle,
            recipe.viewCount
        ]);

        const csvContent = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `viewed-recipes-${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToPDF() {
        window.print();
    }
}
