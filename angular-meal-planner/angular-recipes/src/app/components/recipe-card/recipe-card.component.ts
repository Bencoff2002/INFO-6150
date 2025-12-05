import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserRecipeService } from '../../services/user-recipe.service';
import { stripHtml } from '../../utils/html-utils';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-recipe-card',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './recipe-card.component.html',
    styleUrls: ['./recipe-card.component.scss']
})
export class RecipeCardComponent implements OnInit {
    @Input() recipe: any;
    @Input() featured: boolean = false;
    @Input() rating: number = 0;
    @Input() user: any = null;
    @Input() favorites: any[] = [];
    @Input() sharedByName: string | null = null;

    @Output() open = new EventEmitter<any>();
    @Output() deleted = new EventEmitter<string>();

    menuOpen = false;
    deleteDialogOpen = false;
    ratingDialogOpen = false;
    commentDialogOpen = false;
    sharePromptOpen = false;
    shareLinkDialogOpen = false;
    copySuccess = false;

    userRating = 0;
    newComment = '';
    myRecipeId: string | null = null;
    isMyRecipe = false;
    shareLoading = false;
    shareSuccess = false;
    isFavorite = false;

    private baseUrl = environment.jsonServerUrl;

    constructor(
        private router: Router,
        private http: HttpClient,
        private authService: AuthService,
        private userRecipeService: UserRecipeService,
        private elementRef: ElementRef
    ) { }

    ngOnInit() {
        // Check if recipe is a custom recipe (from My Recipe Book)
        this.isMyRecipe = this.recipe.isMine === true;

        // Subscribe to user changes
        this.authService.user$.subscribe(user => {
            this.user = user;
            if (user) {
                this.checkIfInBook();
                this.loadUserRating();
            }
        });

        // Subscribe to favorites changes
        this.userRecipeService.favorites$.subscribe(favorites => {
            this.favorites = favorites || [];
            this.updateFavoriteStatus();
        });

        // Initial check
        if (this.user) {
            this.checkIfInBook();
            this.loadUserRating();
        }
        this.updateFavoriteStatus();
    }

    @HostListener('document:click', ['$event'])
    clickout(event: any) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.menuOpen = false;
        }
    }

    updateFavoriteStatus() {
        this.isFavorite = this.favorites?.some(f => f.recipeId === this.recipe.id) || false;
    }

    async checkIfInBook() {
        if (!this.user || !this.recipe.id || this.isMyRecipe) return;

        try {
            const response: any = await this.http.get(
                `${this.baseUrl}/myRecipes?userId=${this.user.id}&sourceRecipeId=${this.recipe.id}`
            ).toPromise();

            if (response && response.length > 0) {
                this.myRecipeId = response[0].id;
            }
        } catch (err) {
            console.warn('Failed to check recipe book:', err);
        }
    }

    async loadUserRating() {
        if (!this.user || !this.recipe.id) return;

        try {
            const response: any = await this.http.get(
                `${this.baseUrl}/ratings?recipeId=${this.recipe.id}&userId=${this.user.id}`
            ).toPromise();

            if (response && response.length > 0) {
                this.userRating = response[0].stars;
            }
        } catch (err) {
            console.warn('Failed to load user rating:', err);
        }
    }

    handleClick() {
        if (this.open.observers.length > 0) {
            this.open.emit(this.recipe);
            return;
        }

        if (!this.user) {
            alert('Login to view details');
            return;
        }

        if (this.isMyRecipe) {
            this.router.navigate(['/my-recipes', this.recipe.id]);
        } else {
            this.router.navigate(['/recipe', this.recipe.id]);
        }
    }

    async toggleFavorite(event: Event) {
        event.stopPropagation();

        if (!this.user) {
            alert('Login to add favorites');
            return;
        }

        const existingFavorite = this.favorites.find(f => f.recipeId === this.recipe.id);

        if (existingFavorite) {
            // Optimistically update UI
            this.isFavorite = false;
            await this.userRecipeService.removeFavorite(existingFavorite.id);
        } else {
            // Optimistically update UI
            this.isFavorite = true;
            await this.userRecipeService.addFavorite(this.recipe);
        }
    }

    toggleMenu(event: Event) {
        event.stopPropagation();
        this.menuOpen = !this.menuOpen;
    }

    async addToBook(event: Event) {
        event.stopPropagation();
        this.menuOpen = false;

        if (!this.user) {
            alert('Login to share recipes');
            return;
        }

        try {
            // Ensure ingredients and instructions are in string format
            let ingredients = this.recipe.ingredients || '';
            let instructions = this.recipe.instructions || '';

            // If they're arrays, convert to numbered string format
            if (Array.isArray(this.recipe.ingredients)) {
                ingredients = this.recipe.ingredients
                    .filter((item: any) => item)
                    .map((item: any, idx: number) => `${idx + 1}. ${item}`)
                    .join('\n');
            }

            if (Array.isArray(this.recipe.instructions)) {
                instructions = this.recipe.instructions
                    .filter((item: any) => item)
                    .map((item: any, idx: number) => `${idx + 1}. ${item}`)
                    .join('\n');
            }

            const payload = {
                userId: this.user.id,
                sourceRecipeId: this.recipe.id,
                title: this.recipe.title,
                image: this.recipe.image,
                summary: this.recipe.summary || '',
                servings: this.recipe.servings || null,
                readyInMinutes: this.recipe.readyInMinutes || null,
                dishTypes: this.recipe.dishTypes || [],
                diets: this.recipe.diets || [],
                ingredients,
                instructions,
            };

            const saved: any = await this.http.post(`${this.baseUrl}/myRecipes`, payload).toPromise();
            this.myRecipeId = saved.id;
        } catch (err) {
            console.error('Add to book failed:', err);
        }
    }

    editInBook(event: Event) {
        event.stopPropagation();
        this.menuOpen = false;
        this.router.navigate(['/my-recipes', this.myRecipeId, 'edit']);
    }

    editRecipe(event: Event) {
        event.stopPropagation();
        this.menuOpen = false;
        this.router.navigate(['/my-recipes', this.recipe.id, 'edit']);
    }

    deleteRecipe(event: Event) {
        event.stopPropagation();
        this.menuOpen = false;
        this.deleteDialogOpen = true;
    }

    async handleDeleteConfirm() {
        try {
            await this.http.delete(`${this.baseUrl}/myRecipes/${this.recipe.id}`).toPromise();
            this.deleteDialogOpen = false;
            this.deleted.emit(this.recipe.id);
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete recipe');
            this.deleteDialogOpen = false;
        }
    }

    handleDeleteCancel() {
        this.deleteDialogOpen = false;
    }

    openRatingDialog(event: Event) {
        event.stopPropagation();
        this.menuOpen = false;
        this.ratingDialogOpen = true;
    }

    setUserRating(stars: number) {
        this.userRating = stars;
    }

    async handleRatingSubmit() {
        if (this.userRating === 0 || !this.user) return;

        try {
            // Check if user already rated
            const existing: any = await this.http.get(
                `${this.baseUrl}/ratings?recipeId=${this.recipe.id}&userId=${this.user.id}`
            ).toPromise();

            if (existing && existing.length > 0) {
                // Update existing rating
                await this.http.patch(
                    `${this.baseUrl}/ratings/${existing[0].id}`,
                    { stars: this.userRating }
                ).toPromise();
            } else {
                // Create new rating
                await this.http.post(`${this.baseUrl}/ratings`, {
                    recipeId: this.recipe.id,
                    userId: this.user.id,
                    stars: this.userRating,
                    createdAt: new Date().toISOString()
                }).toPromise();
            }

            this.ratingDialogOpen = false;
        } catch (err) {
            console.error('Rating submission failed:', err);
        }
    }

    openCommentDialog(event: Event) {
        event.stopPropagation();
        this.menuOpen = false;
        this.commentDialogOpen = true;
    }

    async handleCommentSubmit() {
        if (!this.newComment.trim() || !this.user) return;

        try {
            await this.http.post(`${this.baseUrl}/comments`, {
                recipeId: this.recipe.id,
                userId: this.user.id,
                userName: this.user.name || this.user.email,
                comment: this.newComment,
                createdAt: new Date().toISOString()
            }).toPromise();

            this.newComment = '';
            this.commentDialogOpen = false;
        } catch (err) {
            console.error('Comment submission failed:', err);
        }
    }

    async handleShareYes() {
        try {
            this.shareLoading = true;

            const sharedRecipe = {
                userId: this.user.id,
                userName: this.user.name || this.user.email,
                recipeId: this.recipe.id,
                recipeTitle: this.recipe.title,
                recipeImage: this.recipe.image,
                recipeSummary: this.recipe.summary || 'Delicious recipe shared by ' + (this.user.name || this.user.email),
                sharedAt: new Date().toISOString()
            };

            await this.http.post(`${this.baseUrl}/sharedRecipes`, sharedRecipe).toPromise();

            this.shareSuccess = true;

            setTimeout(() => {
                this.sharePromptOpen = false;
                this.shareSuccess = false;
            }, 1500);
        } catch (err) {
            console.error('Failed to share recipe:', err);
            this.sharePromptOpen = false;
        } finally {
            this.shareLoading = false;
        }
    }

    handleShareNo() {
        this.sharePromptOpen = false;
    }

    openShareLinkDialog(event: Event) {
        event.stopPropagation();
        this.menuOpen = false;
        this.shareLinkDialogOpen = true;
        this.copySuccess = false;
    }

    getShareableLink(): string {
        const baseUrl = window.location.origin;
        if (this.isMyRecipe) {
            return `${baseUrl}/my-recipes/${this.recipe.id}`;
        }
        return `${baseUrl}/shared/${this.recipe.id}`;
    }

    async copyShareLink() {
        try {
            const link = this.getShareableLink();
            await navigator.clipboard.writeText(link);
            this.copySuccess = true;
        } catch (err) {
            console.error('Failed to copy link:', err);
            // Fallback for older browsers
            const link = this.getShareableLink();
            const textarea = document.createElement('textarea');
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.copySuccess = true;
        }

        // Reset after 2 seconds
        setTimeout(() => {
            this.copySuccess = false;
        }, 2000);
    }

    handleCopyClick(event: Event) {
        this.copyShareLink();
        // Blur the button to ensure state updates are visible
        const target = event.target as HTMLElement;
        target?.blur();
    }

    getStrippedSummary(): string {
        return stripHtml(this.recipe.summary || '');
    }
}
