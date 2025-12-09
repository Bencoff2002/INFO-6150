import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RecipeCardComponent } from '../../components/recipe-card/recipe-card.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface SharedRecipe {
    id: string;
    recipeId: string;
    recipeTitle: string;
    recipeImage: string;
    sharedBy: string;
    sharedByName: string;
    createdAt: string;
    message?: string;
    recipe?: any;
    // Add optional properties from DB
    userId?: string;
    userName?: string;
    sharedAt?: string;
}

@Component({
    selector: 'app-shared-recipes',
    standalone: true,
    imports: [CommonModule, RecipeCardComponent],
    templateUrl: './shared-recipes.component.html',
    styleUrls: ['./shared-recipes.component.scss']
})
export class SharedRecipesComponent implements OnInit {
    sharedRecipes: SharedRecipe[] = [];
    loading = true;
    error: string | null = null;
    user: any = null;

    constructor(
        private http: HttpClient,
        public router: Router,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
            if (user) {
                this.loadSharedRecipes();
            } else {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async loadSharedRecipes() {
        if (!this.user) {
            this.router.navigate(['/login']);
            return;
        }

        this.loading = true;
        this.error = null;

        try {
            // Fetch shared recipes from JSON server
            const sharedRecipes: any[] = await this.http.get<any[]>(
                `${environment.jsonServerUrl}/sharedRecipes`
            ).toPromise() || [];

            console.log('Fetched shared recipes:', sharedRecipes);

            // Map to consistent format and sort by date (newest first)
            this.sharedRecipes = sharedRecipes
                .filter(share => share.recipeImage && share.recipeImage.trim() !== '')
                .map(share => ({
                    ...share,
                    // Normalize fields
                    sharedBy: share.userId || share.sharedBy,
                    sharedByName: share.userName || share.sharedByName,
                    createdAt: share.sharedAt || share.createdAt,
                    recipe: {
                        id: share.recipeId,
                        title: share.recipeTitle,
                        image: share.recipeImage
                    }
                }))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            this.loading = false;
            this.cdr.detectChanges();
        } catch (err: any) {
            console.error('Failed to load shared recipes:', err);
            this.error = 'Failed to load shared recipes';
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    handleRecipeClick(recipeId: string) {
        this.router.navigate(['/recipe', recipeId]);
    }

    navigateToLogin() {
        this.router.navigate(['/login'], {
            state: { from: this.router.url }
        });
    }

    goBack() {
        window.history.back();
    }

    getRelativeTime(dateString: string): string {
        if (!dateString) return 'Unknown date';

        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) return 'Unknown date';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
