import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpoonacularApiService {
    private baseUrl = 'https://api.spoonacular.com';
    private apiKey = '';

    constructor(private http: HttpClient) {
        this.apiKey = environment.spoonacularApiKey;
    }

    async searchRecipes(query: string, offset = 0, number = 30, category: any = ''): Promise<any> {
        const params: any = {
            apiKey: this.apiKey,
            query,
            number,
            offset,
            addRecipeInformation: true,
            fillIngredients: true
        };
        if (category) {
            if (typeof category === 'object') {
                if (Array.isArray(category.types) && category.types.length > 0) {
                    params.type = category.types[0];
                }
                if (category.diet) params.diet = category.diet;
                if (category.quickEasy) params.maxReadyTime = 30;
            } else if (typeof category === 'string') {
                params.type = category;
            }
        }
        const response: any = await lastValueFrom(this.http.get(`${this.baseUrl}/recipes/complexSearch`, { params }));
        return {
            results: response.results,
            totalResults: response.totalResults,
            offset: response.offset
        };
    }

    async getRecipeDetails(id: number): Promise<any> {
        const response = await fetch(`${this.baseUrl}/recipes/${id}/information?apiKey=${this.apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recipe details');
        }
        return response.json();
    }

    async getRandomRecipes(number = 12): Promise<any> {
        const params: any = {
            apiKey: this.apiKey,
            number,
            sort: 'random',
            addRecipeInformation: true
        };
        const response: any = await lastValueFrom(this.http.get(`${this.baseUrl}/recipes/random`, { params }));
        return {
            results: response.recipes,
            totalResults: number,
            offset: 0
        };
    }
}
