import axios from 'axios';
import { searchRecipes as searchSpoonacular, getRecipeDetails as getSpoonacularDetails, getRandomRecipes as getSpoonacularRandom } from './spoonacularAPI';
import { mockRecipes, mockRecipeDetails } from './mockData';

const jsonServerAPI = axios.create({
    baseURL: 'http://localhost:5001'
});

/**
 * Check if a recipe already exists in JSON server
 */
const checkRecipeExists = async (recipeId) => {
    try {
        const response = await jsonServerAPI.get('/externalRecipes', { params: { spoonacularId: recipeId } });
        return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
        console.warn('Failed to check recipe existence:', error);
        return null;
    }
};

/**
 * Add recipe to JSON server if it doesn't exist
 */
const addRecipeToJsonServer = async (recipe) => {
    try {
        const existingRecipe = await checkRecipeExists(recipe.id);
        if (existingRecipe) {
            return existingRecipe;
        }

        // Transform Spoonacular recipe to our format
        const transformedRecipe = {
            spoonacularId: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            summary: recipe.summary,
            instructions: recipe.instructions,
            extendedIngredients: recipe.extendedIngredients || [],
            cuisines: recipe.cuisines || [],
            dishTypes: recipe.dishTypes || [],
            diets: recipe.diets || [],
            createdAt: new Date().toISOString(),
            source: 'spoonacular'
        };

        const response = await jsonServerAPI.post('/externalRecipes', transformedRecipe);
        return response.data;
    } catch (error) {
        console.warn('Failed to add recipe to JSON server:', error);
        return null;
    }
};

/**
 * Get recipes from JSON server
 */
const getRecipesFromJsonServer = async (query = '', offset = 0, number = 30, category = '') => {
    try {
        const response = await jsonServerAPI.get('/externalRecipes');
        let recipes = response.data;

        // Filter by query
        if (query) {
            const lowercaseQuery = query.toLowerCase();
            recipes = recipes.filter(recipe =>
                recipe.title.toLowerCase().includes(lowercaseQuery) ||
                (recipe.summary || '').toLowerCase().includes(lowercaseQuery)
            );
        }

        // Filter by category if provided
        if (category) {
            if (typeof category === 'object') {
                // Handle category object filtering
                recipes = recipes.filter(recipe => {
                    // Ensure recipe has required fields
                    const recipeDishTypes = recipe.dishTypes || [];
                    const recipeDiets = recipe.diets || [];
                    const recipeReadyTime = recipe.readyInMinutes || 0;

                    // Check diet match
                    if (category.diet) {
                        const hasMatchingDiet = recipeDiets.some(d =>
                            d.toLowerCase().includes(category.diet.toLowerCase())
                        );
                        if (hasMatchingDiet) return true;
                    }

                    // Check types match
                    if (category.types) {
                        const hasMatchingType = category.types.some(type =>
                            recipeDishTypes.some(dt => dt.toLowerCase().includes(type.toLowerCase()))
                        );
                        if (hasMatchingType) return true;
                    }

                    // Check quick & easy (under 30 minutes)
                    if (category.quickEasy && recipeReadyTime > 0 && recipeReadyTime <= 30) {
                        return true;
                    }

                    return false;
                });
            } else {
                // Handle category string filtering
                const lowerCategory = category.toLowerCase();
                recipes = recipes.filter(recipe =>
                    recipe.dishTypes?.some(type => type.toLowerCase().includes(lowerCategory)) ||
                    recipe.diets?.some(diet => diet.toLowerCase().includes(lowerCategory)) ||
                    recipe.cuisines?.some(cuisine => cuisine.toLowerCase().includes(lowerCategory))
                );
            }
        }

        // Remove duplicates based on spoonacularId
        const uniqueRecipes = [];
        const seenIds = new Set();
        for (const recipe of recipes) {
            if (!seenIds.has(recipe.spoonacularId)) {
                seenIds.add(recipe.spoonacularId);
                uniqueRecipes.push(recipe);
            }
        }

        // Paginate results
        const paginatedRecipes = uniqueRecipes.slice(offset, offset + number);

        return {
            results: paginatedRecipes.map(recipe => ({
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
    } catch (error) {
        console.warn('Failed to get recipes from JSON server:', error);
        throw error;
    }
};

/**
 * Get recipe details from JSON server
 */
const getRecipeDetailsFromJsonServer = async (id) => {
    try {
        const response = await jsonServerAPI.get('/externalRecipes', { params: { spoonacularId: id } });
        if (response.data.length === 0) {
            throw new Error('Recipe not found in JSON server');
        }

        const recipe = response.data[0];
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
    } catch (error) {
        console.warn('Failed to get recipe details from JSON server:', error);
        throw error;
    }
};

/**
 * Check if JSON server is available
 */
const isJsonServerAvailable = async () => {
    try {
        await jsonServerAPI.get('/externalRecipes?_limit=1');
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Main search function with fallback mechanism
 * Priority: Spoonacular API -> JSON Server -> Mock Data
 */
export const searchRecipes = async (query = '', offset = 0, number = 30, category = '') => {
    try {
        // Check if we should use real API
        const isRealApiData = process.env.REACT_APP_SPOONACULAR_API_KEY &&
            process.env.REACT_APP_USE_REAL === 'true';

        if (isRealApiData) {
            console.log('🔍 Attempting to search recipes via Spoonacular API...');
            // Try Spoonacular API first
            const spoonacularResult = await searchSpoonacular(query, offset, number, category);

            if (spoonacularResult.results.length > 0) {
                console.log('✅ Spoonacular API successful, adding recipes to JSON server...');

                // Add recipes to JSON server for caching
                const addPromises = spoonacularResult.results.map(async (recipe) => {
                    await addRecipeToJsonServer(recipe);
                });

                await Promise.allSettled(addPromises);
                return spoonacularResult;
            }
        }

        console.log('⚠️ Real Spoonacular API not configured, checking JSON server...');

        // Try JSON server first (when not using real API)
        const jsonServerAvailable = await isJsonServerAvailable();
        if (jsonServerAvailable) {
            console.log('✅ JSON server available, fetching recipes...');
            const jsonServerResult = await getRecipesFromJsonServer(query, offset, number, category);

            // Only use JSON server data if it has results
            if (jsonServerResult.results.length > 0) {
                console.log(`✅ Found ${jsonServerResult.results.length} recipes in JSON server`);
                return jsonServerResult;
            }
            console.log('⚠️ JSON server has no recipes, falling back to mock data...');
        } else {
            console.log('⚠️ JSON server not available, falling back to mock data...');
        }

        // Final fallback to mock data
        console.log('🔄 Using mock data as final fallback...');

        let results = mockRecipes.results;

        // Apply filtering similar to spoonacularAPI.js
        if (query) {
            const lowercaseQuery = query.toLowerCase();
            results = results.filter(recipe =>
                recipe.title.toLowerCase().includes(lowercaseQuery) ||
                (recipe.summary || '').toLowerCase().includes(lowercaseQuery)
            );
        }

        const paginatedResults = results.slice(offset, offset + number);

        return {
            results: paginatedResults,
            totalResults: results.length,
            offset
        };

    } catch (error) {
        console.error('❌ All recipe sources failed:', error);

        // Final fallback to mock data if everything fails
        console.log('🔄 Using mock data as final fallback...');

        let results = mockRecipes.results;

        // Apply filtering similar to spoonacularAPI.js
        if (query) {
            const lowercaseQuery = query.toLowerCase();
            results = results.filter(recipe =>
                recipe.title.toLowerCase().includes(lowercaseQuery) ||
                (recipe.summary || '').toLowerCase().includes(lowercaseQuery)
            );
        }

        const paginatedResults = results.slice(offset, offset + number);

        return {
            results: paginatedResults,
            totalResults: results.length,
            offset
        };
    }
};

/**
 * Get recipe details with fallback mechanism
 * Priority: Spoonacular API -> JSON Server -> Mock Data
 */
export const getRecipeDetails = async (id) => {
    try {
        // Check if we should use real API
        const isRealApiData = process.env.REACT_APP_SPOONACULAR_API_KEY &&
            process.env.REACT_APP_USE_REAL === 'true';

        if (isRealApiData) {
            console.log(`🔍 Attempting to get recipe details for ID ${id} via Spoonacular API...`);
            // Try Spoonacular API first
            const spoonacularResult = await getSpoonacularDetails(id);
            console.log('✅ Spoonacular API successful, adding recipe to JSON server...');
            await addRecipeToJsonServer(spoonacularResult);
            return spoonacularResult;
        }

        console.log(`⚠️ Real Spoonacular API not configured, checking JSON server for recipe ${id}...`);

        // Try JSON server first (when not using real API)
        const jsonServerAvailable = await isJsonServerAvailable();
        if (jsonServerAvailable) {
            try {
                console.log('✅ JSON server available, fetching recipe details...');
                const jsonServerResult = await getRecipeDetailsFromJsonServer(id);
                console.log('✅ Found recipe in JSON server');
                return jsonServerResult;
            } catch (jsonError) {
                console.log('⚠️ Recipe not found in JSON server, falling back to mock data...');
            }
        } else {
            console.log('⚠️ JSON server not available, falling back to mock data...');
        }

        // Final fallback to mock data
        console.log('🔄 Using mock data as final fallback...');
        const recipe = mockRecipes.results.find(r => r.id === parseInt(id));
        const details = mockRecipeDetails.find(d => d.id === parseInt(id));

        if (!recipe && !details) {
            throw new Error('Recipe not found');
        }

        return {
            ...(recipe || {}),
            ...(details || {}),
            id: parseInt(id)
        };

    } catch (error) {
        console.error('❌ All recipe detail sources failed:', error);

        // Final fallback to mock data
        const recipe = mockRecipes.results.find(r => r.id === parseInt(id));
        const details = mockRecipeDetails.find(d => d.id === parseInt(id));

        if (!recipe && !details) {
            throw new Error('Recipe not found');
        }

        return {
            ...(recipe || {}),
            ...(details || {}),
            id: parseInt(id)
        };
    }
};

/**
 * Get random recipes with fallback mechanism
 */
export const getRandomRecipes = async (number = 12) => {
    try {
        // Check if we should use real API
        const isRealApiData = process.env.REACT_APP_SPOONACULAR_API_KEY &&
            process.env.REACT_APP_USE_REAL === 'true';

        if (isRealApiData) {
            console.log('🔍 Attempting to get random recipes via Spoonacular API...');
            const spoonacularResult = await getSpoonacularRandom(number);

            if (spoonacularResult.results.length > 0) {
                console.log('✅ Spoonacular API successful, adding recipes to JSON server...');

                const addPromises = spoonacularResult.results.map(async (recipe) => {
                    await addRecipeToJsonServer(recipe);
                });

                await Promise.allSettled(addPromises);
                return spoonacularResult;
            }
        }

        console.log('⚠️ Real Spoonacular API not configured, checking JSON server...');

        // Try JSON server first (when not using real API)
        const jsonServerAvailable = await isJsonServerAvailable();
        if (jsonServerAvailable) {
            console.log('✅ JSON server available, fetching random recipes...');
            const response = await jsonServerAPI.get('/externalRecipes');
            const recipes = response.data;

            if (recipes.length > 0) {
                console.log(`✅ Found ${recipes.length} recipes in JSON server, selecting ${number} random ones`);
                const shuffled = [...recipes].sort(() => 0.5 - Math.random());
                const randomRecipes = shuffled.slice(0, number);

                return {
                    results: randomRecipes.map(recipe => ({
                        id: recipe.spoonacularId,
                        title: recipe.title,
                        image: recipe.image,
                        readyInMinutes: recipe.readyInMinutes,
                        servings: recipe.servings,
                        summary: recipe.summary,
                        dishTypes: recipe.dishTypes,
                        diets: recipe.diets
                    })),
                    totalResults: number,
                    offset: 0
                };
            }
            console.log('⚠️ JSON server has no recipes, falling back to mock data...');
        } else {
            console.log('⚠️ JSON server not available, falling back to mock data...');
        }

        // Final fallback to mock data
        console.log('🔄 Using mock data as final fallback...');
        const shuffled = [...mockRecipes.results].sort(() => 0.5 - Math.random());
        return {
            results: shuffled.slice(0, number),
            totalResults: number,
            offset: 0
        };

    } catch (error) {
        console.error('❌ All random recipe sources failed:', error);

        // Final fallback to mock data
        const shuffled = [...mockRecipes.results].sort(() => 0.5 - Math.random());
        return {
            results: shuffled.slice(0, number),
            totalResults: number,
            offset: 0
        };
    }
};

/**
 * Utility function to populate JSON server with initial recipe data
 * Call this to seed the database with recipes from Spoonacular
 */
export const initializeRecipeDatabase = async () => {
    try {
        console.log('🚀 Initializing recipe database...');

        const isServerAvailable = await isJsonServerAvailable();
        if (!isServerAvailable) {
            console.log('❌ JSON server not available, skipping database initialization');
            return;
        }

        // Check if we already have recipes
        const existing = await jsonServerAPI.get('/externalRecipes?_limit=1');
        if (existing.data.length > 0) {
            console.log('✅ Recipe database already initialized');
            return;
        }

        // Use Spoonacular API to get initial recipes
        console.log('📥 Fetching initial recipes from Spoonacular API...');
        const recipes = await searchSpoonacular('', 0, 50); // Get 50 initial recipes

        console.log(`📦 Adding ${recipes.results.length} recipes to database...`);

        const addPromises = recipes.results.map(async (recipe) => {
            await addRecipeToJsonServer(recipe);
        });

        await Promise.allSettled(addPromises);

        console.log('✅ Recipe database initialized successfully!');

    } catch (error) {
        console.error('❌ Failed to initialize recipe database:', error);
    }
};
