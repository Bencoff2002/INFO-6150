import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { MealPlan, MealPreferences, WeeklyNotes, SavedMealPlan, DAYS_OF_WEEK, MEAL_TYPES } from '../models/meal-plan.model';
import { RefreshService } from './refresh.service';

@Injectable({ providedIn: 'root' })
export class MealPlanService {
    private baseUrl = environment.jsonServerUrl;

    constructor(private http: HttpClient, private refreshService: RefreshService) { }

    // Meal Plan CRUD
    async getMealPlans(userId: string): Promise<MealPlan[]> {
        return await lastValueFrom(
            this.http.get<MealPlan[]>(`${this.baseUrl}/mealPlans`, {
                params: { userId }
            })
        );
    }

    async createMealPlan(plan: Partial<MealPlan>): Promise<MealPlan> {
        const newPlan = {
            ...plan,
            id: this.generateId(),
            createdAt: new Date().toISOString()
        };
        const result = await lastValueFrom(
            this.http.post<MealPlan>(`${this.baseUrl}/mealPlans`, newPlan)
        );
        this.refreshService.triggerRefresh();
        return result;
    }

    async updateMealPlan(id: string, plan: Partial<MealPlan>): Promise<MealPlan> {
        const result = await lastValueFrom(
            this.http.put<MealPlan>(`${this.baseUrl}/mealPlans/${id}`, plan)
        );
        this.refreshService.triggerRefresh();
        return result;
    }

    async deleteMealPlan(id: string): Promise<void> {
        await lastValueFrom(
            this.http.delete(`${this.baseUrl}/mealPlans/${id}`)
        );
        this.refreshService.triggerRefresh();
    }

    // Weekly Notes
    async getWeeklyNotes(userId: string): Promise<WeeklyNotes | null> {
        const notes = await lastValueFrom(
            this.http.get<WeeklyNotes[]>(`${this.baseUrl}/weeklyNotes`, {
                params: { userId }
            })
        );
        return notes.length > 0 ? notes[0] : null;
    }

    async saveWeeklyNotes(userId: string, notesText: string): Promise<WeeklyNotes> {
        const existing = await this.getWeeklyNotes(userId);

        if (existing) {
            const updated = { ...existing, notes: notesText };
            return await lastValueFrom(
                this.http.put<WeeklyNotes>(`${this.baseUrl}/weeklyNotes/${existing.id}`, updated)
            );
        } else {
            const newNotes: WeeklyNotes = {
                id: this.generateId(),
                userId,
                notes: notesText,
                weekStart: new Date().toISOString()
            };
            return await lastValueFrom(
                this.http.post<WeeklyNotes>(`${this.baseUrl}/weeklyNotes`, newNotes)
            );
        }
    }

    // Admin - Get all users
    async getAllUsers(): Promise<any[]> {
        const users = await lastValueFrom(
            this.http.get<any[]>(`${this.baseUrl}/users`)
        );
        return users.filter(u => !u.isAdmin);
    }

    // Saved Meal Plans
    async getSavedMealPlans(userId: string): Promise<SavedMealPlan[]> {
        return await lastValueFrom(
            this.http.get<SavedMealPlan[]>(`${this.baseUrl}/savedMealPlans`, {
                params: { userId }
            })
        );
    }

    async saveMealPlan(userId: string, name: string, description: string, meals: MealPlan[], notes?: string): Promise<SavedMealPlan> {
        const savedPlan: SavedMealPlan = {
            id: this.generateId(),
            userId,
            name,
            description,
            notes: notes || '',  // Save notes with the plan
            meals: meals.map(m => ({
                day: m.day,
                mealType: m.mealType,
                recipeId: m.recipeId,
                recipeTitle: m.recipeTitle,
                recipeImage: m.recipeImage,
                ingredients: m.ingredients,  // Include ingredients
                title: m.title,
                source: m.source
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return await lastValueFrom(
            this.http.post<SavedMealPlan>(`${this.baseUrl}/savedMealPlans`, savedPlan)
        );
    }

    async loadSavedMealPlan(savedPlanId: string): Promise<SavedMealPlan> {
        return await lastValueFrom(
            this.http.get<SavedMealPlan>(`${this.baseUrl}/savedMealPlans/${savedPlanId}`)
        );
    }

    async updateSavedMealPlan(savedPlanId: string, updatedData: Partial<SavedMealPlan>): Promise<SavedMealPlan> {
        const updatePayload = {
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        return await lastValueFrom(
            this.http.put<SavedMealPlan>(`${this.baseUrl}/savedMealPlans/${savedPlanId}`, updatePayload)
        );
    }

    async deleteSavedMealPlan(savedPlanId: string): Promise<void> {
        await lastValueFrom(
            this.http.delete(`${this.baseUrl}/savedMealPlans/${savedPlanId}`)
        );
    }

    // Auto-generation helper
    generateMealPlan(preferences: MealPreferences, allRecipes: any[], previouslyUsedRecipes: Set<string> = new Set()): Partial<MealPlan>[] {
        // Filter out recipes without images or ingredients first
        const recipesWithCompleteData = allRecipes.filter(recipe => {
            const hasImage = recipe.image && recipe.image.trim() !== '';
            const hasIngredients = (recipe.ingredients && recipe.ingredients.length > 0) ||
                (recipe.extendedIngredients && recipe.extendedIngredients.length > 0);
            return hasImage && hasIngredients;
        });

        console.log(`Filtered recipes: ${recipesWithCompleteData.length} out of ${allRecipes.length} have images and ingredients`);

        const filteredRecipes = this.filterRecipesByPreferences(recipesWithCompleteData, preferences);
        const categorizedRecipes = this.categorizeRecipesByMealType(filteredRecipes);
        const newMealPlans: Partial<MealPlan>[] = [];

        const usedRecipes = {
            breakfast: new Set<string>(previouslyUsedRecipes),
            lunch: new Set<string>(previouslyUsedRecipes),
            dinner: new Set<string>(previouslyUsedRecipes),
            snack: new Set<string>(previouslyUsedRecipes)
        };

        // Helper to get random recipe avoiding duplicates within this week AND previous weeks
        const getRandomRecipe = (recipePool: any[], usedSet: Set<string>) => {
            if (recipePool.length === 0) return null;

            // Filter out recipes used in this week or previous weeks
            const availableRecipes = recipePool.filter(r => !usedSet.has(r.title));

            // If no unused recipes, use all recipes (fallback)
            const poolToUse = availableRecipes.length > 0 ? availableRecipes : recipePool;
            const selected = poolToUse[Math.floor(Math.random() * poolToUse.length)];

            if (selected) {
                usedSet.add(selected.title);
            }
            return selected;
        };

        // Generate meals for each day
        DAYS_OF_WEEK.forEach(day => {
            // Breakfast
            const breakfastRecipes = categorizedRecipes.breakfast.length > 0
                ? categorizedRecipes.breakfast
                : filteredRecipes;
            const randomBreakfast = getRandomRecipe(breakfastRecipes, usedRecipes.breakfast);
            if (randomBreakfast) {
                newMealPlans.push(this.createMealPlanFromRecipe(randomBreakfast, day, 'Breakfast'));
            }

            // Lunch
            const lunchRecipes = categorizedRecipes.lunch.length > 0
                ? categorizedRecipes.lunch
                : filteredRecipes;
            const randomLunch = getRandomRecipe(lunchRecipes, usedRecipes.lunch);
            if (randomLunch) {
                newMealPlans.push(this.createMealPlanFromRecipe(randomLunch, day, 'Lunch'));
            }

            // Dinner
            const dinnerRecipes = categorizedRecipes.dinner.length > 0
                ? categorizedRecipes.dinner
                : filteredRecipes;
            const randomDinner = getRandomRecipe(dinnerRecipes, usedRecipes.dinner);
            if (randomDinner) {
                newMealPlans.push(this.createMealPlanFromRecipe(randomDinner, day, 'Dinner'));
            }

            // Snack (only if includeSnacks is true)
            if (preferences.includeSnacks) {
                const snackRecipes = categorizedRecipes.snack.length > 0
                    ? categorizedRecipes.snack
                    : filteredRecipes;
                const randomSnack = getRandomRecipe(snackRecipes, usedRecipes.snack);
                if (randomSnack) {
                    newMealPlans.push(this.createMealPlanFromRecipe(randomSnack, day, 'Snack'));
                }
            }
        });

        return newMealPlans;
    }

    private filterRecipesByPreferences(recipes: any[], preferences: MealPreferences): any[] {
        return recipes.filter(recipe => {
            // Skip recipes without a valid title
            if (!recipe || !recipe.title || typeof recipe.title !== 'string' || recipe.title.trim() === '') {
                console.warn('Skipping recipe without valid title:', recipe);
                return false;
            }

            const title = recipe.title.toLowerCase();

            // Vegetarian filter
            if (preferences.isVegetarian) {
                const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'meat', 'bacon', 'sausage', 'fish', 'salmon', 'tuna', 'shrimp', 'crab'];
                if (meatKeywords.some(keyword => title.includes(keyword))) {
                    return false;
                }
            }

            // Weight loss filter (avoid high-calorie foods)
            if (preferences.isWeightLoss) {
                const highCalKeywords = ['fried', 'crispy', 'creamy', 'butter', 'cheese', 'chocolate', 'cake', 'cookie', 'pie', 'ice cream', 'pasta', 'pizza'];
                if (highCalKeywords.some(keyword => title.includes(keyword))) {
                    return false;
                }
            }

            // Allergy filter - check both title AND ingredients
            if (preferences.allergies.length > 0) {
                const allergyKeywords = preferences.allergies.map(a => a.toLowerCase());

                // Check recipe title
                if (allergyKeywords.some(keyword => title.includes(keyword))) {
                    return false;
                }

                // Check ingredients array (if available)
                if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                    const ingredientsText = recipe.ingredients.join(' ').toLowerCase();
                    if (allergyKeywords.some(keyword => ingredientsText.includes(keyword))) {
                        return false;
                    }
                }

                // Check extendedIngredients (for Spoonacular recipes)
                if (recipe.extendedIngredients && Array.isArray(recipe.extendedIngredients)) {
                    for (const ing of recipe.extendedIngredients) {
                        const ingText = ((ing.name || '') + ' ' + (ing.original || '')).toLowerCase();
                        if (allergyKeywords.some(keyword => ingText.includes(keyword))) {
                            return false;
                        }
                    }
                }
            }

            return true;
        });
    }

    private categorizeRecipesByMealType(recipes: any[]): { breakfast: any[], lunch: any[], dinner: any[], snack: any[] } {
        const breakfast: any[] = [];
        const lunch: any[] = [];
        const dinner: any[] = [];
        const snack: any[] = [];

        recipes.forEach(recipe => {
            // Skip recipes without a title
            if (!recipe || !recipe.title) {
                return;
            }

            const title = recipe.title.toLowerCase();

            // Breakfast keywords
            if (title.includes('breakfast') || title.includes('pancake') || title.includes('waffle') ||
                title.includes('oatmeal') || title.includes('cereal') || title.includes('toast') ||
                title.includes('egg') || title.includes('bacon') || title.includes('sausage') ||
                title.includes('muffin') || title.includes('bagel') || title.includes('croissant') ||
                title.includes('smoothie') || title.includes('yogurt') || title.includes('granola')) {
                breakfast.push(recipe);
            }
            // Lunch keywords
            else if (title.includes('lunch') || title.includes('sandwich') || title.includes('wrap') ||
                title.includes('burger') || title.includes('salad') || title.includes('soup')) {
                lunch.push(recipe);
            }
            // Dinner keywords
            else if (title.includes('dinner') || title.includes('steak') || title.includes('roast') ||
                title.includes('grilled') || title.includes('baked') || title.includes('pasta') ||
                title.includes('curry') || title.includes('stew') || title.includes('casserole')) {
                dinner.push(recipe);
            }
            // Snack keywords
            else if (title.includes('snack') || title.includes('chip') || title.includes('dip') ||
                title.includes('cookie') || title.includes('brownie') || title.includes('bar')) {
                snack.push(recipe);
            }
            // Default to dinner if no category matches
            else {
                dinner.push(recipe);
            }
        });

        return { breakfast, lunch, dinner, snack };
    }

    private createMealPlanFromRecipe(recipe: any, day: string, mealType: string): Partial<MealPlan> {
        return {
            day,
            mealType,
            recipeId: recipe.id || recipe.spoonacularId,
            recipeTitle: recipe.title,
            recipeImage: recipe.image,
            ingredients: recipe.ingredients || recipe.extendedIngredients?.map((ing: any) => ing.name || ing.original) || [],
            title: recipe.title,
            source: recipe.source || (recipe.userId ? 'myRecipes' : 'externalRecipes')
        };
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
