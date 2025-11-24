import axios from 'axios';
import { mockRecipes, mockRecipeDetails } from './mockData';

const BASE_URL = 'https://api.spoonacular.com';

const spoonacularAPI = axios.create({
    baseURL: BASE_URL,
    params: {
        apiKey: process.env.REACT_APP_SPOONACULAR_API_KEY
    }
});

// Simulate API delay for mock data
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Filter mock recipes based on search query or category
// category may be a string (legacy) or an object with { types: [...], diet: 'vegetarian', quickEasy: true }
const filterRecipes = (query, category = '') => {
    let results = mockRecipes.results;

    // Normalize category into an object form
    let catObj = null;
    if (category) {
        if (typeof category === 'string') {
            const low = category.toLowerCase();
            catObj = { raw: low };
        } else if (typeof category === 'object') {
            catObj = category;
        }
    }

    if (catObj) {
        results = results.filter(recipe => {
            // derive normalized fields with fallbacks (support both mock shapes)
            const details = mockRecipeDetails.find(d => d.id === recipe.id);
            const typesArr = (recipe.type || recipe.dishTypes || details?.dishTypes || []).map(t => String(t).toLowerCase());
            const dietsArr = (recipe.diet || recipe.diets || details?.diets || []).map(d => String(d).toLowerCase());

            // helper: keyword fallback when tags are missing or incomplete
            const textBlob = `${recipe.title || ''} ${(recipe.summary || '')}`.toLowerCase();
            const keywordMatchForTypes = (types) => {
                if (!types || types.length === 0) return false;
                const synonyms = {
                    appetizer: ['appetizer', 'starter', 'snack', 'fingerfood'],
                    fingerfood: ['fingerfood', 'finger food', 'appetizer'],
                    snack: ['snack', 'appetizer'],
                    salad: ['salad'],
                    'side dish': ['side dish', 'side'],
                    breakfast: ['breakfast', 'brunch'],
                    dessert: ['dessert', 'sweet', 'cake', 'cookie', 'pie', 'tiramisu', 'ice cream'],
                    soup: ['soup', 'broth', 'bisque'],
                    beverage: ['beverage', 'drink', 'smoothie', 'juice', 'soda', 'coffee', 'tea'],
                    drink: ['drink', 'beverage', 'smoothie', 'juice', 'soda', 'coffee', 'tea']
                };
                return types.some(t => {
                    const tLow = String(t).toLowerCase();
                    const keys = synonyms[tLow] || [tLow];
                    return keys.some(k => textBlob.includes(k));
                });
            };

            // quickEasy flag
            if (catObj.quickEasy) {
                if (recipe.readyInMinutes == null) return false;
                if (recipe.readyInMinutes <= 30) return true;
            }

            // diet filter
            if (catObj.diet) {
                if (dietsArr.some(d => d === String(catObj.diet).toLowerCase())) return true;
            }

            // types array filter
            if (catObj.types && Array.isArray(catObj.types)) {
                const wanted = catObj.types.map(x => String(x).toLowerCase());
                if (typesArr.some(t => wanted.includes(t))) return true;
                // fallback to keyword match in title/summary if tags didn't match
                if (keywordMatchForTypes(wanted)) return true;
            }

            // fallback: if category.raw string provided, match type/diet/cuisines using includes
            if (catObj.raw) {
                const lowerCategory = catObj.raw;
                return (
                    typesArr.some(t => t.includes(lowerCategory)) ||
                    dietsArr.some(d => d.includes(lowerCategory)) ||
                    recipe.cuisines?.some(cuisine => cuisine.toLowerCase().includes(lowerCategory))
                );
            }

            return false;
        });
    }

    if (query) {
        const lowercaseQuery = query.toLowerCase();
        results = results.filter(recipe =>
            recipe.title.toLowerCase().includes(lowercaseQuery) ||
            (recipe.summary || '').toLowerCase().includes(lowercaseQuery)
        );
    }

    return results;
};

export const searchRecipes = async (query, offset = 0, number = 30, category = '') => {
    // If an actual Spoonacular API key and flag are provided, call the real API.
    const useReal = !!process.env.REACT_APP_SPOONACULAR_API_KEY && process.env.REACT_APP_USE_REAL === 'true';

    if (useReal) {
        // Map our category object/string into Spoonacular params
        const params = {
            query,
            number,
            offset,
            addRecipeInformation: true,
            fillIngredients: true
        };

        if (category) {
            // category may be an object { types: [], diet, quickEasy } or a string
            if (typeof category === 'object') {
                if (Array.isArray(category.types) && category.types.length > 0) {
                    // Spoonacular accepts a single type; use the first preferred type
                    params.type = category.types[0];
                }
                if (category.diet) params.diet = category.diet;
                if (category.quickEasy) params.maxReadyTime = 30;
            } else if (typeof category === 'string') {
                params.type = category;
            }
        }

        try {
            const response = await spoonacularAPI.get('/recipes/complexSearch', { params });
            return {
                results: response.data.results,
                totalResults: response.data.totalResults,
                offset: response.data.offset
            };
        } catch (err) {
            // Fall back to mock on error
            console.warn('Spoonacular API request failed, falling back to mock:', err.message || err);
        }
    }

    // Using mock data
    await delay(500); // Simulate network delay

    const filteredRecipes = filterRecipes(query, category);
    const paginatedRecipes = filteredRecipes.slice(offset, offset + number);

    return {
        results: paginatedRecipes,
        totalResults: filteredRecipes.length,
        offset: offset
    };

    // Original API call implementation
    /*
    try {
        const response = await spoonacularAPI.get('/recipes/complexSearch', {
            params: {
                query,
                number,
                offset,
                addRecipeInformation: true,  // Include additional recipe details
                fillIngredients: true        // Include ingredient information
            }
        });
        return {
            results: response.data.results,
            totalResults: response.data.totalResults,
            offset: response.data.offset
        };
    } catch (err) {
        throw new Error(err?.response?.data?.message || err.message || 'Failed to search recipes');
    }
    */
};

export const getRecipeDetails = async (id) => {
    // Using mock data
    await delay(500); // Simulate network delay

    const recipe = mockRecipes.results.find(r => r.id === parseInt(id));
    const details = mockRecipeDetails.find(d => d.id === parseInt(id));

    if (!recipe && !details) {
        throw new Error('Recipe not found');
    }

    // Merge base recipe with detailed mock data (if available)
    return {
        ...(recipe || {}),
        ...(details || {}),
        id: parseInt(id),
        title: (recipe && recipe.title) || (details && details.title),
        image: (recipe && recipe.image) || (details && details.image)
    };

};

export const getRandomRecipes = async (number = 12) => {
    // Using mock data
    await delay(500); // Simulate network delay

    const shuffled = [...mockRecipes.results].sort(() => 0.5 - Math.random());
    return {
        results: shuffled.slice(0, number),
        totalResults: number,
        offset: 0
    };

};