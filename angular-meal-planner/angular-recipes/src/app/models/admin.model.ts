export interface DashboardStatistics {
    totalUsers: number;
    totalRecipes: number;
    totalMealPlans: number;
    totalFavorites: number;
    activeMealPlans: number;
}

export interface UserWithStats {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    recipeCount: number;
    mealPlanCount: number;
    favoritesCount: number;
    createdAt?: string;
    lastActive?: string;
}

export interface ActivityItem {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: 'created_recipe' | 'created_meal_plan' | 'added_favorite' | 'shared_recipe';
    description: string;
    timestamp: string;
    itemId?: string;
    itemName?: string;
}

export interface RecipeStats {
    id: string;
    title: string;
    author: string;
    favoritesCount: number;
    rating?: number;
    createdAt: string;
}
