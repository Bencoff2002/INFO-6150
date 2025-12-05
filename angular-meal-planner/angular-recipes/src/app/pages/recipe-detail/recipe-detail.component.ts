import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Subscription, Observable } from 'rxjs';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { stripHtml } from '../../utils/html-utils';

@Component({
    selector: 'app-recipe-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './recipe-detail.component.html',
    styleUrls: ['./recipe-detail.component.scss']
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
    recipe: any = null;
    loading = true;
    error: string | null = null;
    user$: Observable<any>;
    isCustomRecipe = false;
    private subscriptions: Subscription[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private sanitizer: DomSanitizer,
        private http: HttpClient,
        private recipeService: RecipeService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {
        this.user$ = this.authService.user$;
    }

    ngOnInit() {
        // Get route data to determine if this is a custom recipe
        this.isCustomRecipe = this.route.snapshot.data['isCustomRecipe'] || false;

        // Get recipe ID from route params
        const routeSub = this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.loadRecipe(id);
            }
        });
        this.subscriptions.push(routeSub);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    async loadRecipe(id: string) {
        console.log('Loading recipe with ID:', id);
        this.loading = true;
        this.error = null;

        try {
            let data: any;

            if (this.isCustomRecipe) {
                console.log('Fetching custom recipe from myRecipes API');
                // Fetch from myRecipes API
                const response = await this.http.get<any>(
                    `${environment.jsonServerUrl}/myRecipes/${id}`
                ).toPromise();

                data = {
                    ...response,
                    // Ensure instructions and ingredients are strings for display
                    instructions: response.instructions || '',
                    ingredients: response.ingredients || ''
                };
            } else {
                console.log('Fetching recipe from RecipeService');
                // Fetch from Spoonacular API via RecipeService
                data = await this.recipeService.getRecipeDetails(Number(id));
            }

            console.log('Recipe data received:', data);
            this.recipe = data;
            this.loading = false;
            console.log('Loading set to false, recipe:', this.recipe);
            this.cdr.detectChanges();
        } catch (err: any) {
            console.error('Failed to load recipe:', err);
            this.error = err.message || 'Failed to load recipe';
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    goBack() {
        // Check if there's navigation state
        const state = this.location.getState() as any;

        if (state?.from === '/meal-planner') {
            this.router.navigate(['/meal-planner']);
        } else {
            this.location.back();
        }
    }

    sanitizeHtml(html: string): SafeHtml {
        return this.sanitizer.sanitize(1, html) || '';
    }

    getStrippedHtml(html: string): string {
        return stripHtml(html);
    }

    navigateToLogin() {
        this.router.navigate(['/login'], {
            state: { from: this.router.url }
        });
    }

    getBackButtonText(): string {
        const state = this.location.getState() as any;
        return state?.fromName || '';
    }

    get typeof() {
        return (val: any) => typeof val;
    }
}
