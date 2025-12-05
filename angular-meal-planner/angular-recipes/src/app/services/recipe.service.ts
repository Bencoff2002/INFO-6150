import { Injectable } from '@angular/core';
import { SpoonacularApiService } from './spoonacular-api.service';
import { JsonServerApiService } from './json-server-api.service';
import { MockDataService } from './mock-data.service';

@Injectable({ providedIn: 'root' })
export class RecipeService {
    constructor(
        private spoonacular: SpoonacularApiService,
        private jsonServer: JsonServerApiService,
        private mockData: MockDataService
    ) { }

    async searchRecipes(query = '', offset = 0, number = 30, category: any = ''): Promise<any> {
        try {
            const spoonacularResult = await this.spoonacular.searchRecipes(query, offset, number, category);
            if (spoonacularResult.results && spoonacularResult.results.length > 0) {
                return spoonacularResult;
            }
        } catch (e) {
            console.warn('RecipeService: Spoonacular search failed, attempting fallback', e);
        }
        try {
            console.log('RecipeService: Attempting to search from JSON Server');
            const jsonServerResult = await this.jsonServer.getRecipes(query, offset, number, category);
            if (jsonServerResult.results && jsonServerResult.results.length > 0) {
                console.log('RecipeService: Successfully searched from JSON Server');
                return jsonServerResult;
            }
        } catch (e) {
            console.warn('RecipeService: JSON Server search failed', e);
        }
        return this.mockData.getRecipes(query, offset, number, category);
    }

    async getRecipeDetails(id: number): Promise<any> {
        console.log(`RecipeService: Fetching details for recipe ID ${id}`);
        try {
            const spoonacularResult = await this.spoonacular.getRecipeDetails(id);
            if (spoonacularResult && spoonacularResult.id) {
                console.log('RecipeService: Successfully fetched from Spoonacular');
                return spoonacularResult;
            }
        } catch (e) {
            console.warn('RecipeService: Spoonacular fetch failed, attempting fallback', e);
        }

        try {
            console.log('RecipeService: Attempting to fetch from JSON Server (externalRecipes)');

            const jsonServerResult = await this.jsonServer.getRecipeDetails(id);
            if (jsonServerResult && jsonServerResult.id) {
                console.log('RecipeService: Successfully fetched from JSON Server', jsonServerResult);
                return jsonServerResult;
            }
        } catch (e) {
            console.warn('RecipeService: JSON Server fetch failed', e);
        }

        console.log('RecipeService: Falling back to mock data');
        return this.mockData.getRecipeDetails(id);
    }

    async getRandomRecipes(number = 12): Promise<any> {
        try {
            const spoonacularResult = await this.spoonacular.getRandomRecipes(number);
            if (spoonacularResult.results && spoonacularResult.results.length > 0) {
                return spoonacularResult;
            }
        } catch (e) {
            console.warn('RecipeService: Spoonacular random fetch failed, attempting fallback', e);
        }
        try {
            console.log('RecipeService: Attempting to fetch random recipes from JSON Server');
            const jsonServerResult = await this.jsonServer.getRecipes('', 0, number, '');
            if (jsonServerResult.results && jsonServerResult.results.length > 0) {
                console.log('RecipeService: Successfully fetched random recipes from JSON Server');
                return jsonServerResult;
            }
        } catch (e) {
            console.warn('RecipeService: JSON Server random fetch failed', e);
        }
        return this.mockData.getRandomRecipes(number);
    }
}
