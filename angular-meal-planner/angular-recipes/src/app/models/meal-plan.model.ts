export interface MealPlan {
    id: string;
    userId: string;
    title: string;
    day: string; // 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
    mealType: string; // 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
    recipeId: string | number;
    recipeTitle: string;
    recipeImage: string;
    ingredients?: string[];  // Array of ingredient names
    source: 'myRecipes' | 'externalRecipes' | 'favorites';
    createdAt: string;
}

export interface MealPreferences {
    isVegetarian: boolean;
    isWeightLoss: boolean;
    allergies: string[];
    includeSnacks?: boolean;  // Optional: whether to generate snacks
}

export interface WeeklyNotes {
    id: string;
    userId: string;
    notes: string;
    weekStart?: string;
}

export interface SavedMealPlan {
    id: string;
    userId: string;
    name: string;
    description?: string;
    notes?: string;  // Unique notes for this specific meal plan
    meals: Partial<MealPlan>[]; // Array of meals (up to 28)
    createdAt: string;
    updatedAt: string;
}

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];
export type MealType = typeof MEAL_TYPES[number];
