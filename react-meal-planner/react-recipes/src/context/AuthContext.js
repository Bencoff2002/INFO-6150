import { createContext, useState, useContext, useEffect, useRef } from 'react';
import {
    loginUser as apiLoginUser,
    registerUser as apiRegisterUser,
    getFavorites as apiGetFavorites,
    addFavorite as apiAddFavorite,
    removeFavorite as apiRemoveFavorite,
    updateFavorite as apiUpdateFavorite,
    updateUserStatus,
    cleanupInactiveSessions,
    pingUserActivity
} from '../services/jsonServerAPI';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const sessionStartTime = useRef(Date.now());
    const lastActivityTime = useRef(Date.now());

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            // Update active status on initial load
            const parsedUser = JSON.parse(savedUser);
            updateUserStatus(parsedUser.id, true).catch(console.error);
        }
        setLoading(false);
    }, []);

    // Track user activity and session time
    useEffect(() => {
        if (!user) return;

        const updateActivity = async () => {
            const currentTime = Date.now();
            const sessionTime = Math.floor((currentTime - sessionStartTime.current) / 1000); // Convert to seconds
            await updateUserStatus(user.id, true, sessionTime);
            lastActivityTime.current = currentTime;
        };

        const pingActivity = () => {
            if (user) {
                pingUserActivity(user.id).catch(console.error);
                lastActivityTime.current = Date.now();
            }
        };

        // Clean up inactive sessions every 15 minutes
        const cleanupInterval = setInterval(() => {
            cleanupInactiveSessions().catch(console.error);
        }, 15 * 60 * 1000);

        // Update active status and session time every 5 minutes
        const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);

        // Ping activity every minute
        const pingInterval = setInterval(pingActivity, 60 * 1000);

        // Track user interactions
        const trackUserActivity = () => {
            lastActivityTime.current = Date.now();
            pingActivity();
        };

        // Add event listeners for user activity
        window.addEventListener('mousemove', trackUserActivity);
        window.addEventListener('keydown', trackUserActivity);
        window.addEventListener('click', trackUserActivity);
        window.addEventListener('scroll', trackUserActivity);

        // Clean up on unmount
        return () => {
            clearInterval(cleanupInterval);
            clearInterval(activityInterval);
            clearInterval(pingInterval);
            window.removeEventListener('mousemove', trackUserActivity);
            window.removeEventListener('keydown', trackUserActivity);
            window.removeEventListener('click', trackUserActivity);
            window.removeEventListener('scroll', trackUserActivity);

            // Calculate final session time and mark user as inactive
            const finalSessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
            updateUserStatus(user.id, false, finalSessionTime).catch(console.error);
        };
    }, [user]);

    const login = async (email, password) => {
        try {
            const userData = await apiLoginUser(email);
            if (!userData || userData.password !== password) {
                throw new Error('Invalid credentials');
            }
            const { password: _, ...userWithoutPassword } = userData;
            setUser(userWithoutPassword);
            localStorage.setItem('user', JSON.stringify(userWithoutPassword));
            // load favorites for this user
            try {
                const favs = await apiGetFavorites(userWithoutPassword.id);
                setFavorites(favs || []);
            } catch (e) {
                setFavorites([]);
            }
            return userWithoutPassword;
        } catch (err) {
            throw new Error('Login failed: ' + (err.message || 'Unknown error'));
        }
    };

    const register = async (email, password, name, preferences = []) => {
        try {
            // Check if user already exists
            const existingUser = await apiLoginUser(email);
            if (existingUser) {
                throw new Error('User already exists');
            }

            const newUser = await apiRegisterUser({
                email,
                password,
                name,
                preferences,
                createdAt: new Date().toISOString(),
                totalTimeSpent: 0,
                lastActive: new Date().toISOString(),
                lastPing: new Date().toISOString()
            });

            const { password: _, ...userWithoutPassword } = newUser;
            setUser(userWithoutPassword);
            localStorage.setItem('user', JSON.stringify(userWithoutPassword));
            // load favorites for new user (should be empty)
            setFavorites([]);
            return userWithoutPassword;
        } catch (err) {
            throw new Error('Registration failed: ' + (err.message || 'Unknown error'));
        }
    };

    const logout = async () => {
        if (user) {
            try {
                await updateUserStatus(user.id, false);
            } catch (err) {
                console.error('Failed to update user status:', err);
            }
        }
        setUser(null);
        localStorage.removeItem('user');
    };

    // Favorites state and helpers
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        // when component mounts, if user exists load favorites
        const load = async () => {
            if (user) {
                try {
                    const favs = await apiGetFavorites(user.id);
                    setFavorites(favs || []);
                } catch (e) {
                    setFavorites([]);
                }
            } else {
                setFavorites([]);
            }
        };
        load();
    }, [user]);

    const addFavorite = async (recipe) => {
        if (!user) throw new Error('Must be logged in to add favorites');
        const favObj = {
            userId: user.id,
            recipeId: recipe.id,
            title: recipe.title,
            image: recipe.image,
            notes: recipe.notes || ''
        };
        const created = await apiAddFavorite(favObj);
        setFavorites((s) => [...s, created]);
        return created;
    };

    const removeFavorite = async (favoriteId) => {
        await apiRemoveFavorite(favoriteId);
        setFavorites((s) => s.filter((f) => f.id !== favoriteId));
        return true;
    };

    const editFavorite = async (favoriteId, updates) => {
        const updated = await apiUpdateFavorite(favoriteId, updates);
        setFavorites((s) => s.map((f) => (f.id === favoriteId ? updated : f)));
        return updated;
    };

    if (loading) {
        return null; // or a loading spinner
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, favorites, addFavorite, removeFavorite, editFavorite }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);