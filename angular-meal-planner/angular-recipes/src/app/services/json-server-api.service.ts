import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JsonServerApiService {
    private baseUrl = environment.jsonServerUrl;

    constructor(private http: HttpClient) { }

    async isAvailable(): Promise<boolean> {
        try {
            await lastValueFrom(this.http.get(`${this.baseUrl}/externalRecipes`, { params: { _limit: 1 } }));
            return true;
        } catch {
            return false;
        }
    }

    async getRecipes(query = '', offset = 0, number = 30, category: any = ''): Promise<any> {
        const response: any = await lastValueFrom(this.http.get(`${this.baseUrl}/externalRecipes`));
        let recipes = response;
        if (query) {
            const lowercaseQuery = query.toLowerCase();
            recipes = recipes.filter((recipe: any) =>
                recipe.title.toLowerCase().includes(lowercaseQuery) ||
                (recipe.summary || '').toLowerCase().includes(lowercaseQuery)
            );
        }
        if (category) {
            if (typeof category === 'object' && category.types) {
                const wanted = category.types.map((x: string) => x.toLowerCase());
                recipes = recipes.filter((recipe: any) =>
                    (recipe.dishTypes || []).some((t: string) => wanted.includes(t.toLowerCase()))
                );
            }
            if (typeof category === 'string') {
                const catStr = category.toLowerCase();
                recipes = recipes.filter((recipe: any) =>
                    (recipe.dishTypes || []).some((t: string) => t.toLowerCase().includes(catStr))
                );
            }
        }
        const uniqueRecipes: any[] = [];
        const seenIds = new Set();
        for (const recipe of recipes) {
            if (!seenIds.has(recipe.spoonacularId)) {
                uniqueRecipes.push(recipe);
                seenIds.add(recipe.spoonacularId);
            }
        }
        const paginatedRecipes = uniqueRecipes.slice(offset, offset + number);
        return {
            results: paginatedRecipes.map((recipe: any) => ({
                id: recipe.spoonacularId,
                title: recipe.title,
                image: recipe.image,
                readyInMinutes: recipe.readyInMinutes,
                servings: recipe.servings,
                summary: recipe.summary,
                dishTypes: recipe.dishTypes,
                diets: recipe.diets
            })),
            totalResults: uniqueRecipes.length,
            offset
        };
    }

    async getRecipeDetails(id: number): Promise<any> {
        const response: any = await lastValueFrom(this.http.get(`${this.baseUrl}/externalRecipes`, { params: { spoonacularId: id } }));
        if (response.length === 0) throw new Error('Recipe not found in JSON server');
        const recipe = response[0];
        return {
            id: recipe.spoonacularId,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            summary: recipe.summary,
            instructions: recipe.instructions,
            extendedIngredients: recipe.extendedIngredients,
            cuisines: recipe.cuisines,
            dishTypes: recipe.dishTypes,
            diets: recipe.diets
        };
    }
}
