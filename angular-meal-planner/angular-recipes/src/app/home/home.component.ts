import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../services/recipe.service';

interface Category {
    label: string;
    icon: string;
    value: any;
}

@Component({
    selector: 'app-home',
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

    constructor(private recipeService: RecipeService) { }

    ngOnInit() {
        this.loadRecipes();
    }

    async loadRecipes() {
        this.loading = true;
        this.error = null;
        try {
            const res = await this.recipeService.getRandomRecipes(12);
            this.recipes = res.results;
            this.totalResults = res.totalResults ?? res.results?.length ?? 0;
            this.isSearchMode = false;
        } catch (e) {
            this.error = 'Failed to load recipes';
        } finally {
            this.loading = false;
        }
    }

    async handleSearch() {
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
        } catch (e) {
            this.error = 'Failed to search recipes';
        } finally {
            this.loading = false;
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
        } catch (e) {
            this.error = 'Failed to load page';
        } finally {
            this.loading = false;
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
        } catch (e) {
            this.error = 'Failed to filter recipes';
            this.recipes = [];
        } finally {
            this.loading = false;
        }
    }

    handleLogout() {
        this.user = null;
        // Add actual logout logic here
    }
}
