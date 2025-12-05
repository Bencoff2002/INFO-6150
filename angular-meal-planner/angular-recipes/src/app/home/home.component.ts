import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { RecipeCardComponent } from '../components/recipe-card/recipe-card.component';
import { RecipeService } from '../services/recipe.service';
import { AuthService } from '../services/auth.service';

interface Category {
    label: string;
    icon: string;
    value: any;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, FormsModule, NavbarComponent, RecipeCardComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    searchTerm = '';
    recipes: any[] = [];
    loading = false;
    error: string | null = null;
    activeCategory: Category = { label: 'All Types', icon: '🍽️', value: null };
    currentPage = 1;
    recipesPerPage = 8;
    totalResults = 0;
    isSearchMode = false;

    user: any = { name: 'Demo User' }; // Replace with actual auth context
    favorites: any[] = []; // Replace with actual favorites
    isAdmin = false;

    categories: Category[] = [
        { label: 'All', icon: '🍽️', value: null },
        { label: 'Appetizers', icon: '🍜', value: { types: ['appetizer', 'fingerfood', 'snack'] } },
        { label: 'Main Course', icon: '🍖', value: { types: ['main course'] } },
        { label: 'Salads & Sides', icon: '🥗', value: { types: ['salad', 'side dish'] } },
        { label: 'Vegetarian', icon: '🥕', value: { diet: 'vegetarian' } },
        { label: 'Breakfast', icon: '☀️', value: { types: ['breakfast'] } },
        { label: 'Dessert', icon: '🍰', value: { types: ['dessert'] } },
        { label: 'Soups', icon: '🍲', value: { types: ['soup'] } },
        { label: 'Drinks', icon: '🥤', value: { types: ['beverage', 'drink'] } },
        { label: 'Quick & Easy', icon: '⚡', value: { quickEasy: true } }
    ];

    constructor(
        private recipeService: RecipeService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private authService: AuthService
    ) { }

    async ngOnInit() {
        // Get current user status first
        const currentUser = this.authService.getCurrentUser();
        this.isAdmin = currentUser?.isAdmin || false;
        this.user = currentUser;

        // Also subscribe to changes
        this.authService.user$.subscribe(user => {
            const wasAdmin = this.isAdmin;
            this.isAdmin = user?.isAdmin || false;
            this.user = user;

            // If admin status changed and now not admin, load recipes
            if (wasAdmin && !this.isAdmin) {
                this.loadRecipes();
            }
        });

        // Only load recipes if not admin
        if (!this.isAdmin) {
            await this.loadRecipes();
        }
    }

    async loadRecipes() {
        // Don't load recipes for admins
        if (this.isAdmin) return;

        this.loading = true;
        this.error = null;
        try {
            const res = await this.recipeService.getRandomRecipes(12);
            this.recipes = res.results;
            this.totalResults = res.totalResults ?? res.results?.length ?? 0;
            this.isSearchMode = false;
            this.cdr.detectChanges();
        } catch (e) {
            this.error = 'Failed to load recipes';
            this.cdr.detectChanges();
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async handleSearch(term?: string) {
        if (term) {
            this.searchTerm = term;
        }
        if (!this.searchTerm.trim()) return;
        this.loading = true;
        this.error = null;
        try {
            const categoryValue = this.activeCategory?.value ?? null;
            const res = await this.recipeService.searchRecipes(this.searchTerm, 0, this.recipesPerPage, categoryValue);
            this.recipes = res.results;
            this.totalResults = res.totalResults ?? res.results?.length ?? 0;
            this.currentPage = 1;
            this.isSearchMode = true;
            this.cdr.detectChanges();
        } catch (e) {
            this.error = 'Failed to search recipes';
            this.cdr.detectChanges();
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async fetchPage(page: number) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loading = true;
        this.error = null;
        try {
            const offset = (page - 1) * this.recipesPerPage;
            const categoryValue = this.activeCategory?.value ?? null;
            const res = await this.recipeService.searchRecipes(this.searchTerm || '', offset, this.recipesPerPage, categoryValue);
            this.recipes = res.results;
            this.totalResults = res.totalResults ?? res.results?.length ?? 0;
            this.currentPage = page;
            this.isSearchMode = true;
            this.cdr.detectChanges();
        } catch (e) {
            this.error = 'Failed to load page';
            this.cdr.detectChanges();
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async handleCategorySelect(category: Category) {
        if (this.activeCategory?.label === category?.label && category?.value) return;
        this.recipes = [];
        this.activeCategory = category;
        this.currentPage = 1;
        this.searchTerm = '';
        if (!category?.value) {
            await this.loadRecipes();
            return;
        }
        this.loading = true;
        this.error = null;
        try {
            const res = await this.recipeService.searchRecipes('', 0, this.recipesPerPage, category.value);
            this.recipes = res.results;
            this.totalResults = res.totalResults ?? res.results?.length ?? 0;
            this.isSearchMode = true;
            this.cdr.detectChanges();
        } catch (e) {
            this.error = 'Failed to filter recipes';
            this.recipes = [];
            this.cdr.detectChanges();
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    handleLogout() {
        this.user = null;
        this.authService.logout();
        this.router.navigate(['/']);
    }

    // Admin navigation methods
    navigateToStatistics() {
        // Navigate to statistics page
        this.router.navigate(['/admin/statistics']);
    }

    navigateToUserManagement() {
        this.router.navigate(['/admin/users']);
    }

    navigateToReports() {
        this.router.navigate(['/admin/reports']);
    }
}
