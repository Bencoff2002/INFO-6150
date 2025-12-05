import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RecipeCardComponent } from '../../components/recipe-card/recipe-card.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-my-recipe-book',
    standalone: true,
    imports: [CommonModule, RecipeCardComponent],
    templateUrl: './my-recipe-book.component.html',
    styleUrls: ['./my-recipe-book.component.scss']
})
export class MyRecipeBookComponent implements OnInit {
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
                this.loadMyRecipes();
            } else {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async loadMyRecipes() {
        if (!this.user) {
            this.router.navigate(['/login']);
            return;
        }

        this.loading = true;
        this.error = null;

        try {
            // Fetch user's custom recipes from JSON server
            const myRecipes: any[] = await this.http.get<any[]>(
                `${environment.jsonServerUrl}/myRecipes?userId=${this.user.id}`
            ).toPromise() || [];

            console.log('Fetched my recipes:', myRecipes);

            this.recipes = myRecipes;
            this.loading = false;
            this.cdr.detectChanges();
        } catch (err: any) {
            console.error('Failed to load my recipes:', err);
            this.error = 'Failed to load your recipes';
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    handleRecipeClick(recipe: any) {
        this.router.navigate(['/my-recipes', recipe.id]);
    }

    navigateToLogin() {
        this.router.navigate(['/login'], {
            state: { from: this.router.url }
        });
    }

    createNewRecipe() {
        this.router.navigate(['/recipe/new']);
    }

    goBack() {
        this.location.back();
    }
}
