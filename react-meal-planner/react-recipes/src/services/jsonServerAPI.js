import axios from 'axios';

const jsonServerAPI = axios.create({
    baseURL: 'http://localhost:5001'  // Using port 5001 as configured earlier
});

// USERS
export const loginUser = async (email) => {
    try {
        const response = await jsonServerAPI.get('/users', { params: { email } });
        const user = response.data[0] ?? null;
        if (user) {
            await jsonServerAPI.patch(`/users/${user.id}`, {
                active: true,
                lastActive: new Date().toISOString()
            });
            return { ...user, active: true, lastActive: new Date().toISOString() };
        }
        return null;
    } catch (err) {
        throw new Error(err?.message || 'Failed to login');
    }
};

export const registerUser = async (userObj) => {
    try {
        const userWithStatus = {
            ...userObj,
            active: true,
            lastActive: new Date().toISOString()
        };
        const response = await jsonServerAPI.post('/users', userWithStatus);
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to register user');
    }
};

export const updateUserStatus = async (userId, isActive, sessionTime = 0) => {
    try {
        const response = await jsonServerAPI.patch(`/users/${userId}`, {
            active: isActive,
            lastActive: isActive ? new Date().toISOString() : null,
            ...(sessionTime > 0 && { totalTimeSpent: sessionTime })
        });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to update user status');
    }
};

export const cleanupInactiveSessions = async () => {
    try {
        const response = await jsonServerAPI.get('/users', { params: { active: true } });
        const activeUsers = response.data;
        const inactiveTimeout = 30 * 60 * 1000; // 30 minutes
        const now = new Date();
        for (const user of activeUsers) {
            const lastActive = new Date(user.lastActive);
            if (now - lastActive > inactiveTimeout) {
                await updateUserStatus(user.id, false);
            }
        }
    } catch (err) {
        console.error('Failed to cleanup inactive sessions:', err);
    }
};

export const pingUserActivity = async (userId) => {
    try {
        // json-server doesn't support sub-resources like /users/:id/ping by default
        // Patch the user resource directly instead
        const response = await jsonServerAPI.patch(`/users/${userId}`, {
            lastPing: new Date().toISOString()
        });
        return response.data;
    } catch (err) {
        console.warn('Failed to ping user activity:', err);
    }
};

// FAVORITES
export const getFavorites = async (userId) => {
    try {
        const response = await jsonServerAPI.get('/favorites', { params: { userId } });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to get favorites');
    }
};

export const addFavorite = async (favoriteObj) => {
    try {
        const response = await jsonServerAPI.post('/favorites', favoriteObj);
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to add favorite');
    }
};

export const removeFavorite = async (id) => {
    try {
        await jsonServerAPI.delete(`/favorites/${id}`);
        return true;
    } catch (err) {
        throw new Error(err?.message || 'Failed to remove favorite');
    }
};

export const updateFavorite = async (id, data) => {
    try {
        const response = await jsonServerAPI.patch(`/favorites/${id}`, data);
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to update favorite');
    }
};

// COMMENTS
export const getComments = async (recipeId) => {
    try {
        const response = await jsonServerAPI.get('/comments', { params: { recipeId } });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to get comments');
    }
};

export const addComment = async ({ recipeId, userId, userName, text }) => {
    try {
        const payload = {
            recipeId: String(recipeId),
            userId,
            userName,
            text,
            createdAt: new Date().toISOString()
        };
        const response = await jsonServerAPI.post('/comments', payload);
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to add comment');
    }
};

// RATINGS
export const getRatings = async (recipeId) => {
    try {
        const response = await jsonServerAPI.get('/ratings', { params: { recipeId } });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to get ratings');
    }
};

export const getUserRating = async (recipeId, userId) => {
    try {
        const response = await jsonServerAPI.get('/ratings', { params: { recipeId, userId } });
        return response.data[0] ?? null;
    } catch (err) {
        throw new Error(err?.message || 'Failed to get user rating');
    }
};

export const upsertRating = async ({ recipeId, userId, stars, recipeTitle, recipeImage }) => {
    try {
        // Ensure one rating per user per recipe
        const existing = await getUserRating(String(recipeId), userId);
        const payload = {
            recipeId: String(recipeId),
            userId,
            stars,
            recipeTitle,
            recipeImage,
            updatedAt: new Date().toISOString(),
        };
        if (existing) {
            const response = await jsonServerAPI.patch(`/ratings/${existing.id}`, payload);
            return response.data;
        } else {
            const response = await jsonServerAPI.post('/ratings', { ...payload, createdAt: new Date().toISOString() });
            return response.data;
        }
    } catch (err) {
        throw new Error(err?.message || 'Failed to save rating');
    }
};

export const getAllRatings = async () => {
    try {
        const response = await jsonServerAPI.get('/ratings');
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to fetch all ratings');
    }
};

// Get all users (for admin functionality)
export const getAllUsers = async () => {
    try {
        const response = await jsonServerAPI.get('/users');
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to fetch all users');
    }
};

// Get all favorites (for admin functionality)
export const getAllFavorites = async () => {
    try {
        const response = await jsonServerAPI.get('/favorites');
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to fetch all favorites');
    }
};

// MY RECIPES (User-created or saved editable copies)
export const getMyRecipes = async (userId) => {
    try {
        const response = await jsonServerAPI.get('/myRecipes', { params: { userId } });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to load your recipes');
    }
};

export const addMyRecipe = async (recipe) => {
    try {
        const payload = {
            ...recipe,
            // ensure id not set; json-server will assign if not provided
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const response = await jsonServerAPI.post('/myRecipes', payload);
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to add recipe to your book');
    }
};

export const updateMyRecipe = async (id, updates) => {
    try {
        const response = await jsonServerAPI.patch(`/myRecipes/${id}`, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to update your recipe');
    }
};

export const deleteMyRecipe = async (id) => {
    try {
        await jsonServerAPI.delete(`/myRecipes/${id}`);
        return true;
    } catch (err) {
        throw new Error(err?.message || 'Failed to delete your recipe');
    }
};

// MEAL PLANS
export const getMealPlans = async (userId) => {
    try {
        const response = await jsonServerAPI.get('/mealPlans', { params: { userId } });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to fetch meal plans');
    }
};

export const getAllMealPlans = async () => {
    try {
        const response = await jsonServerAPI.get('/mealPlans');
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to fetch meal plans');
    }
};

export const createMealPlan = async (mealPlan) => {
    try {
        const payload = {
            ...mealPlan,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const response = await jsonServerAPI.post('/mealPlans', payload);
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to create meal plan');
    }
};

export const updateMealPlan = async (id, updates) => {
    try {
        const response = await jsonServerAPI.patch(`/mealPlans/${id}`, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
        return response.data;
    } catch (err) {
        throw new Error(err?.message || 'Failed to update meal plan');
    }
};

export const deleteMealPlan = async (id) => {
    try {
        await jsonServerAPI.delete(`/mealPlans/${id}`);
        return true;
    } catch (err) {
        throw new Error(err?.message || 'Failed to delete meal plan');
    }
};

// Weekly Notes functions
export const getWeeklyNotes = async (userId) => {
    try {
        const response = await jsonServerAPI.get('/weeklyNotes', { params: { userId } });
        return response.data[0] || null; // Return first note or null
    } catch (err) {
        throw new Error(err?.message || 'Failed to get weekly notes');
    }
};

export const saveWeeklyNotes = async (userId, notes) => {
    try {
        // Check if notes already exist for this user
        const existingNotes = await getWeeklyNotes(userId);

        if (existingNotes) {
            // Update existing notes
            const response = await jsonServerAPI.put(`/weeklyNotes/${existingNotes.id}`, {
                ...existingNotes,
                notes,
                updatedAt: new Date().toISOString()
            });
            return response.data;
        } else {
            // Create new notes
            const response = await jsonServerAPI.post('/weeklyNotes', {
                userId,
                notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return response.data;
        }
    } catch (err) {
        throw new Error(err?.message || 'Failed to save weekly notes');
    }
};

export default jsonServerAPI;
