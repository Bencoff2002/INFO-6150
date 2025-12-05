import { Injectable } from '@angular/core';
import { mockRecipes } from './mockData';

@Injectable({ providedIn: 'root' })
export class MockDataService {
    getRecipes(query = '', offset = 0, number = 30, category: any = ''): any {
        const recipes = mockRecipes.results || [];
        let results = recipes;
        if (query) {
            const lowercaseQuery = query.toLowerCase();
            results = results.filter((recipe: any) =>
                recipe.title.toLowerCase().includes(lowercaseQuery) ||
                (recipe.summary || '').toLowerCase().includes(lowercaseQuery)
            );
        }
        if (category) {
            if (typeof category === 'object' && category.types) {
                const wanted = category.types.map((x: string) => x.toLowerCase());
                results = results.filter((recipe: any) =>
                    (recipe.dishTypes || []).some((t: string) => wanted.includes(t.toLowerCase()))
                );
            }
            if (typeof category === 'string') {
                const catStr = category.toLowerCase();
                results = results.filter((recipe: any) =>
                    (recipe.dishTypes || []).some((t: string) => t.toLowerCase().includes(catStr))
                );
            }
        }
        const paginatedResults = results.slice(offset, offset + number);
        return {
            results: paginatedResults,
            totalResults: results.length,
            offset
        };
    }

    getRecipeDetails(id: number): any {
        const recipes = mockRecipes.results || [];
        const recipe = recipes.find((r: any) => r.id === id);
        return recipe || {};
    }

    getRandomRecipes(number = 12): any {
        const recipes = mockRecipes.results || [];
        const shuffled = [...recipes].sort(() => 0.5 - Math.random());
        return {
            results: shuffled.slice(0, number),
            totalResults: number,
            offset: 0
        };
    }
}
