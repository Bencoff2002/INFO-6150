import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardStatistics, UserWithStats, ActivityItem, RecipeStats } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private baseUrl = environment.jsonServerUrl;

    constructor(private http: HttpClient) { }

    async getStatistics(): Promise<DashboardStatistics> {
        const [users, recipes, mealPlans, savedMealPlans, favorites] = await Promise.all([
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/users`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/recipes`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/mealPlans`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/savedMealPlans`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/favorites`))
        ]);

        // Filter out admin users from count
        const nonAdminUsers = users.filter(u => !u.isAdmin);

        return {
            totalUsers: nonAdminUsers.length,
            totalRecipes: recipes.length,
            totalMealPlans: savedMealPlans.length,
            totalFavorites: favorites.length,
            activeMealPlans: mealPlans.length
        };
    }

    async getAllUsersWithStats(): Promise<UserWithStats[]> {
        const [users, recipes, savedMealPlans, favorites] = await Promise.all([
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/users`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/recipes`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/savedMealPlans`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/favorites`))
        ]);

        // Filter out admin users
        const nonAdminUsers = users.filter(u => !u.isAdmin);

        return nonAdminUsers.map(user => {
            const userRecipes = recipes.filter(r => r.userId === user.id);
            const userMealPlans = savedMealPlans.filter(mp => mp.userId === user.id);
            const userFavorites = favorites.filter(f => f.userId === user.id);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                recipeCount: userRecipes.length,
                mealPlanCount: userMealPlans.length,
                favoritesCount: userFavorites.length,
                createdAt: user.createdAt,
                lastActive: user.lastActive
            };
        });
    }

    async getUserDetails(userId: string): Promise<UserWithStats | null> {
        try {
            const user = await lastValueFrom(
                this.http.get<any>(`${this.baseUrl}/users/${userId}`)
            );

            const [recipes, savedMealPlans, favorites] = await Promise.all([
                lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/recipes`, {
                    params: { userId }
                })),
                lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/savedMealPlans`, {
                    params: { userId }
                })),
                lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/favorites`, {
                    params: { userId }
                }))
            ]);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                recipeCount: recipes.length,
                mealPlanCount: savedMealPlans.length,
                favoritesCount: favorites.length,
                createdAt: user.createdAt,
                lastActive: user.lastActive
            };
        } catch (error) {
            console.error('Error fetching user details:', error);
            return null;
        }
    }

    async getTopRecipes(limit: number = 10): Promise<RecipeStats[]> {
        const [recipes, favorites] = await Promise.all([
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/recipes`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/favorites`))
        ]);

        const recipesWithStats = recipes.map(recipe => {
            const favCount = favorites.filter(f => f.recipeId === recipe.id).length;
            return {
                id: recipe.id,
                title: recipe.title,
                author: recipe.author || 'Unknown',
                favoritesCount: favCount,
                rating: recipe.rating,
                createdAt: recipe.createdAt
            };
        });

        // Sort by favorites count
        return recipesWithStats
            .sort((a, b) => b.favoritesCount - a.favoritesCount)
            .slice(0, limit);
    }

    async getRecentActivity(limit: number = 20): Promise<ActivityItem[]> {
        const [recipes, savedMealPlans, favorites, users] = await Promise.all([
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/recipes`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/savedMealPlans`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/favorites`)),
            lastValueFrom(this.http.get<any[]>(`${this.baseUrl}/users`))
        ]);

        const activities: ActivityItem[] = [];

        // Add recipe creations
        recipes.forEach(recipe => {
            const user = users.find(u => u.id === recipe.userId);
            if (user && recipe.createdAt) {
                activities.push({
                    id: `recipe-${recipe.id}`,
                    userId: recipe.userId,
                    userName: user.name,
                    userEmail: user.email,
                    action: 'created_recipe',
                    description: `Created recipe: ${recipe.title}`,
                    timestamp: recipe.createdAt,
                    itemId: recipe.id,
                    itemName: recipe.title
                });
            }
        });

        // Add meal plan creations
        savedMealPlans.forEach(plan => {
            const user = users.find(u => u.id === plan.userId);
            if (user && plan.createdAt) {
                activities.push({
                    id: `mealplan-${plan.id}`,
                    userId: plan.userId,
                    userName: user.name,
                    userEmail: user.email,
                    action: 'created_meal_plan',
                    description: `Created meal plan: ${plan.name}`,
                    timestamp: plan.createdAt,
                    itemId: plan.id,
                    itemName: plan.name
                });
            }
        });

        // Sort by timestamp (most recent first) and limit
        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }
}
