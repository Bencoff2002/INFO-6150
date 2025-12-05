import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RecipeCardComponent } from '../../components/recipe-card/recipe-card.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-favourites',
    standalone: true,
    imports: [CommonModule, RecipeCardComponent],
    templateUrl: './favourites.component.html',
    styleUrls: ['./favourites.component.scss']
})
export class FavouritesComponent implements OnInit {
    recipes: any[] = [];
    loading = true;
    error: string | null = null;
    user: any = null;

    constructor(
        private http: HttpClient,
        public router: Router,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private location: Location
    ) { }

    async ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
            if (user) {
                this.loadFavourites();
            } else {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async loadFavourites() {
        if (!this.user) {
            this.router.navigate(['/login']);
            return;
        }

        this.loading = true;
        this.error = null;

        try {
            // Fetch user's favourites from JSON server
            const favourites: any[] = await this.http.get<any[]>(
                `${environment.jsonServerUrl}/favorites?userId=${this.user.id}`
            ).toPromise() || [];

            console.log('Fetched favourites:', favourites);

            // Map favourites to recipe format
            this.recipes = favourites.map(fav => ({
                id: fav.recipeId,
                title: fav.title,
                image: fav.image,
                isFavorite: true,
                favoriteId: fav.id
            }));

            this.loading = false;
            this.cdr.detectChanges();
        } catch (err: any) {
            console.error('Failed to load favourites:', err);
            this.error = 'Failed to load favourite recipes';
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    handleRecipeClick(recipe: any) {
        this.router.navigate(['/recipe', recipe.id]);
    }

    navigateToLogin() {
        this.router.navigate(['/login'], {
            state: { from: this.router.url }
        });
    }

    goBack() {
        this.location.back();
    }
}
