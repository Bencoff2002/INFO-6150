import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RecipeCardComponent } from '../../components/recipe-card/recipe-card.component';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-top-rated',
    standalone: true,
    imports: [CommonModule, RecipeCardComponent],
    templateUrl: './top-rated.component.html',
    styleUrls: ['./top-rated.component.scss']
})
export class TopRatedComponent implements OnInit {
    recipes: any[] = [];
    loading = true;
    error: string | null = null;

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private location: Location
    ) { }

    async ngOnInit() {
        await this.loadTopRatedRecipes();
    }

    async loadTopRatedRecipes() {
        this.loading = true;
        this.error = null;

        try {
            // Fetch all ratings from JSON server
            const ratings: any[] = await this.http.get<any[]>(
                `${environment.jsonServerUrl}/ratings`
            ).toPromise() || [];

            // Calculate average rating per recipe
            const recipeRatings = new Map<string, { sum: number, count: number, recipe: any }>();

            for (const rating of ratings) {
                const recipeId = rating.recipeId;
                if (!recipeRatings.has(recipeId)) {
                    recipeRatings.set(recipeId, {
                        sum: 0,
                        count: 0,
                        recipe: {
                            id: recipeId,
                            title: rating.recipeTitle,
                            image: rating.recipeImage
                        }
                    });
                }
                const current = recipeRatings.get(recipeId)!;
                current.sum += rating.stars;
                current.count += 1;
            }

            // Convert to array with average ratings
            const recipesWithRatings = Array.from(recipeRatings.entries())
                .map(([id, data]) => ({
                    ...data.recipe,
                    averageRating: data.sum / data.count,
                    ratingCount: data.count
                }))
                .filter(recipe => recipe.ratingCount >= 1) // At least 1 rating
                .sort((a, b) => b.averageRating - a.averageRating) // Sort by rating descending
                .slice(0, 20); // Top 20

            this.recipes = recipesWithRatings;
            this.loading = false;
            this.cdr.detectChanges();
        } catch (err: any) {
            console.error('Failed to load top rated recipes:', err);
            this.error = 'Failed to load top rated recipes';
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    handleRecipeClick(recipe: any) {
        this.router.navigate(['/recipe', recipe.id]);
    }

    goBack() {
        this.location.back();
    }
}
