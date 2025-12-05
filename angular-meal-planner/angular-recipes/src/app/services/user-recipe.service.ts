import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Favorite {
    id?: string;
    userId: string;
    recipeId: number;
    recipeTitle: string;
    recipeImage: string;
    addedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserRecipeService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private baseUrl = environment.jsonServerUrl;

    private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
    public favorites$ = this.favoritesSubject.asObservable();

    constructor() {
        // Subscribe to user changes to load favorites
        this.authService.user$.subscribe(user => {
            if (user) {
                this.loadFavorites(user.id);
            } else {
                this.favoritesSubject.next([]);
            }
        });
    }

    /**
     * Load all favorites for a specific user
     */
    async loadFavorites(userId: string): Promise<void> {
        try {
            const favorites = await this.http.get<Favorite[]>(`${this.baseUrl}/favorites?userId=${userId}`).toPromise();
            this.favoritesSubject.next(favorites || []);
        } catch (err) {
            console.error('Failed to load favorites:', err);
            this.favoritesSubject.next([]);
        }
    }

    /**
     * Add a recipe to the user's favorites
     */
    async addFavorite(recipe: any): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) {
            console.error('Cannot add favorite: User not authenticated');
            return;
        }

        try {
            const favorite: Favorite = {
                userId: user.id,
                recipeId: recipe.id,
                recipeTitle: recipe.title,
                recipeImage: recipe.image,
                addedAt: new Date().toISOString()
            };

            const saved = await this.http.post<Favorite>(`${this.baseUrl}/favorites`, favorite).toPromise();
            const currentFavorites = this.favoritesSubject.value;
            this.favoritesSubject.next([...currentFavorites, saved!]);
        } catch (err) {
            console.error('Failed to add favorite:', err);
            throw err;
        }
    }

    /**
     * Remove a recipe from the user's favorites
     */
    async removeFavorite(favoriteId: string): Promise<void> {
        try {
            await this.http.delete(`${this.baseUrl}/favorites/${favoriteId}`).toPromise();
            const currentFavorites = this.favoritesSubject.value;
            this.favoritesSubject.next(currentFavorites.filter(f => f.id !== favoriteId));
        } catch (err) {
            console.error('Failed to remove favorite:', err);
            throw err;
        }
    }

    /**
     * Check if a recipe is in the user's favorites
     */
    isFavorite(recipeId: number): boolean {
        const favorites = this.favoritesSubject.value;
        return favorites.some(f => f.recipeId === recipeId);
    }

    /**
     * Get all current favorites
     */
    getFavorites(): Favorite[] {
        return this.favoritesSubject.value;
    }

    /**
     * Clear all favorites (typically called on logout)
     */
    clearFavorites(): void {
        this.favoritesSubject.next([]);
    }
}
