import { useState, useEffect, useCallback } from 'react';
import { searchRecipes, getRecipeDetails, getRandomRecipes } from '../services/recipeService';

export const useRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalResults, setTotalResults] = useState(0);
    const [currentOffset, setCurrentOffset] = useState(0);

    // Search recipes with caching and fallback
    const searchRecipesWithFallback = useCallback(async (query = '', offset = 0, number = 30, category = '') => {
        setLoading(true);
        setError(null);

        try {
            const result = await searchRecipes(query, offset, number, category);

            if (offset === 0) {
                // New search - replace results
                setRecipes(result.results);
            } else {
                // Pagination - append results
                setRecipes(prev => [...prev, ...result.results]);
            }

            setTotalResults(result.totalResults);
            setCurrentOffset(result.offset);

        } catch (err) {
            setError(err.message || 'Failed to fetch recipes');
            console.error('Recipe search error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get random recipes
    const getRandomRecipesWithFallback = useCallback(async (number = 12) => {
        setLoading(true);
        setError(null);

        try {
            const result = await getRandomRecipes(number);
            setRecipes(result.results);
            setTotalResults(result.totalResults);
            setCurrentOffset(0);
        } catch (err) {
            setError(err.message || 'Failed to fetch random recipes');
            console.error('Random recipes error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load more recipes (pagination)
    const loadMoreRecipes = useCallback(async (query = '', category = '', number = 30) => {
        if (loading) return; // Prevent multiple concurrent requests

        const nextOffset = currentOffset + number;
        await searchRecipesWithFallback(query, nextOffset, number, category);
    }, [loading, currentOffset, searchRecipesWithFallback]);

    // Clear results
    const clearRecipes = useCallback(() => {
        setRecipes([]);
        setTotalResults(0);
        setCurrentOffset(0);
        setError(null);
    }, []);

    return {
        recipes,
        loading,
        error,
        totalResults,
        currentOffset,
        searchRecipes: searchRecipesWithFallback,
        getRandomRecipes: getRandomRecipesWithFallback,
        loadMoreRecipes,
        clearRecipes
    };
};

export const useRecipeDetails = (recipeId) => {
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRecipeDetails = useCallback(async (id) => {
        if (!id) return;

        setLoading(true);
        setError(null);

        try {
            const result = await getRecipeDetails(id);
            setRecipe(result);
        } catch (err) {
            setError(err.message || 'Failed to fetch recipe details');
            console.error('Recipe details error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (recipeId) {
            fetchRecipeDetails(recipeId);
        }
    }, [recipeId, fetchRecipeDetails]);

    return {
        recipe,
        loading,
        error,
        refetch: () => fetchRecipeDetails(recipeId)
    };
};
