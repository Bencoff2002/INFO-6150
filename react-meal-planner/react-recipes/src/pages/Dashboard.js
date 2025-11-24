import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Select,
    FormControl,
    InputLabel,
    Avatar,
    ListItemIcon,
    ListItemText,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Tooltip,
    TextField,
    Rating,
    Stack
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getAllRatings, getAllUsers, getAllFavorites } from '../services/jsonServerAPI';
import { getRecipeDetails, searchRecipes } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import RecipeGrid from '../components/RecipeGrid';
import RecipeCard from '../components/RecipeCard';

function Dashboard() {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, favorites } = useAuth();
    const location = useLocation();
    const viewParam = new URLSearchParams(location.search).get('view');
    const view = (viewParam === 'top-rated' || viewParam === 'favorites') ? viewParam : 'favorites';

    // Admin functionality states
    const [allUsers, setAllUsers] = useState([]);
    const [allFavorites, setAllFavorites] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('all');

    // Filter state for Top Rated
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [activeCategory, setActiveCategory] = useState({ label: 'All Types', value: null });

    // Admin management states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'rating'|'favorite', id, recipeId, userId }
    const [deletingItems, setDeletingItems] = useState(new Set());

    // Edit functionality states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null); // { type: 'rating'|'favorite', item, originalItem }
    const [editValue, setEditValue] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editStars, setEditStars] = useState(5);
    const [isEditing, setIsEditing] = useState(false);

    // Pagination states
    const [topRatedPage, setTopRatedPage] = useState(1);
    const [favoritesPage, setFavoritesPage] = useState(1);
    const recipesPerPage = 8;

    const categories = [
        { label: 'All Types', icon: '🍽️', value: null },
        { label: 'Appetizers', icon: '🍜', value: { types: ['appetizer', 'fingerfood', 'snack'] } },
        { label: 'Main Course', icon: '🍖', value: { types: ['main course'] } },
        { label: 'Salads & Sides', icon: '🥗', value: { types: ['salad', 'side dish'] } },
        { label: 'Vegetarian', icon: '🥕', value: { diet: 'vegetarian' } },
        { label: 'Breakfast', icon: '☀️', value: { types: ['breakfast'] } },
        { label: 'Dessert', icon: '🍰', value: { types: ['dessert'] } },
        { label: 'Soups', icon: '🍲', value: { types: ['soup'] } },
        { label: 'Drinks', icon: '🥤', value: { types: ['beverage', 'drink'] } },
        { label: 'Quick & Easy', icon: '⚡', value: { quickEasy: true } }
    ];

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAllRatings();
                if (mounted) setRatings(Array.isArray(data) ? data : []);

                // Load additional data for admin users
                if (user?.isAdmin) {
                    const [usersData, favoritesData] = await Promise.all([
                        getAllUsers(),
                        getAllFavorites()
                    ]);
                    if (mounted) {
                        setAllUsers(Array.isArray(usersData) ? usersData.filter(u => !u.isAdmin) : []);
                        setAllFavorites(Array.isArray(favoritesData) ? favoritesData : []);
                    }
                }
            } catch (err) {
                if (mounted) {
                    console.error('Dashboard error:', err);
                    setError(err.message || 'Failed to load ratings');
                    setRatings([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false };
    }, [user]);

    // Get all recipes with 4-5 star average ratings (filtered by user if admin)
    const topRatedRecipes = useMemo(() => {
        if (!ratings.length) return [];

        // Filter ratings by selected user if admin has selected a specific user
        let filteredRatings = ratings;
        if (user?.isAdmin && selectedUserId !== 'all') {
            filteredRatings = ratings.filter(r => r.userId === selectedUserId);
        }
        // For regular users and admin viewing 'all', show ratings from all users

        const groups = filteredRatings.reduce((acc, r) => {
            const key = String(r.recipeId);
            if (!acc[key]) acc[key] = { sum: 0, count: 0, recipeId: key, title: r.recipeTitle, image: r.recipeImage };
            acc[key].sum += (r.stars || 0);
            acc[key].count += 1;
            if (!acc[key].title && r.recipeTitle) acc[key].title = r.recipeTitle;
            if (!acc[key].image && r.recipeImage) acc[key].image = r.recipeImage;
            return acc;
        }, {});

        const list = Object.values(groups).map(g => ({
            recipeId: g.recipeId,
            avg: g.count ? g.sum / g.count : 0,
            count: g.count,
            title: g.title,
            image: g.image
        }));

        // Filter for 4-5 star recipes only
        const filtered = list.filter(item => item.avg >= 4.0);

        filtered.sort((a, b) => {
            if (b.avg !== a.avg) return b.avg - a.avg;
            return b.count - a.count;
        });

        return filtered;
    }, [ratings, user, selectedUserId]);

    // Get current user favorites (or selected user's favorites if admin)
    const currentFavorites = useMemo(() => {
        if (user?.isAdmin && selectedUserId !== 'all') {
            return allFavorites.filter(f => f.userId === selectedUserId);
        } else if (user?.isAdmin && selectedUserId === 'all') {
            return allFavorites; // Show all favorites for all users
        } else {
            return favorites || []; // Regular user's favorites
        }
    }, [user, selectedUserId, allFavorites, favorites]);

    // Enriched data for rendering RecipeCard with summary/servings/time
    const [enrichedTopRated, setEnrichedTopRated] = useState([]);
    const [enrichedFavorites, setEnrichedFavorites] = useState([]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!topRatedRecipes.length) { if (mounted) setEnrichedTopRated([]); return; }
            try {
                const details = await Promise.all(
                    topRatedRecipes.map(async (t) => {
                        try {
                            const d = await getRecipeDetails(t.recipeId);
                            return {
                                id: Number(t.recipeId),
                                title: d.title || t.title,
                                image: d.image || t.image,
                                summary: d.summary,
                                servings: d.servings,
                                readyInMinutes: d.readyInMinutes,
                                rating: Number(t.avg.toFixed(1)),
                                dishTypes: d.dishTypes || [],
                                diets: d.diets || [],
                                veryHealthy: d.veryHealthy,
                                cheap: d.cheap,
                                veryPopular: d.veryPopular
                            };
                        } catch {
                            return {
                                id: Number(t.recipeId),
                                title: t.title,
                                image: t.image,
                                rating: Number(t.avg.toFixed(1)),
                                dishTypes: [],
                                diets: [],
                                readyInMinutes: null
                            };
                        }
                    })
                );
                // Remove duplicates based on id
                const uniqueDetails = [];
                const seenIds = new Set();
                for (const detail of details) {
                    if (!seenIds.has(detail.id)) {
                        seenIds.add(detail.id);
                        uniqueDetails.push(detail);
                    }
                }
                if (mounted) setEnrichedTopRated(uniqueDetails);
            } catch {
                if (mounted) setEnrichedTopRated([]);
            }
        };
        load();
        return () => { mounted = false };
    }, [topRatedRecipes]);

    useEffect(() => {
        let mounted = true;
        const loadFavs = async () => {
            if (!currentFavorites || currentFavorites.length === 0) {
                if (mounted) setEnrichedFavorites([]);
                return;
            }
            try {
                const details = await Promise.all(
                    currentFavorites.map(async (f) => {
                        try {
                            const d = await getRecipeDetails(f.recipeId);
                            return {
                                id: Number(f.recipeId),
                                title: d.title || f.title,
                                image: d.image || f.image,
                                summary: d.summary,
                                servings: d.servings,
                                readyInMinutes: d.readyInMinutes,
                                dishTypes: d.dishTypes || [],
                                diets: d.diets || [],
                                userId: f.userId, // Add userId for admin view
                                userName: user?.isAdmin ? allUsers.find(u => u.id === f.userId)?.name : undefined
                            };
                        } catch {
                            return {
                                id: Number(f.recipeId),
                                title: f.title,
                                image: f.image,
                                dishTypes: [],
                                diets: [],
                                readyInMinutes: null,
                                userId: f.userId,
                                userName: user?.isAdmin ? allUsers.find(u => u.id === f.userId)?.name : undefined
                            };
                        }
                    })
                );
                // Remove duplicates based on id
                const uniqueDetails = [];
                const seenIds = new Set();
                for (const detail of details) {
                    if (!seenIds.has(detail.id)) {
                        seenIds.add(detail.id);
                        uniqueDetails.push(detail);
                    }
                }
                if (mounted) setEnrichedFavorites(uniqueDetails);
            } catch {
                if (mounted) setEnrichedFavorites([]);
            }
        };
        loadFavs();
        return () => { mounted = false };
    }, [currentFavorites, user, allUsers]);

    // Helper function to filter recipes by category
    const filterByCategory = (recipes, category) => {
        if (!category?.value || !recipes.length) return recipes;

        const categoryValue = category.value;
        return recipes.filter(recipe => {
            // Type filtering
            if (categoryValue.types) {
                const hasMatchingType = categoryValue.types.some(type =>
                    recipe.dishTypes?.some(dt => dt.toLowerCase().includes(type.toLowerCase()))
                );
                if (!hasMatchingType) return false;
            }

            // Diet filtering
            if (categoryValue.diet) {
                const hasMatchingDiet = recipe.diets?.some(d =>
                    d.toLowerCase().includes(categoryValue.diet.toLowerCase())
                );
                if (!hasMatchingDiet) return false;
            }

            // Quick & Easy filtering (under 30 minutes)
            if (categoryValue.quickEasy) {
                if (!recipe.readyInMinutes || recipe.readyInMinutes > 30) return false;
            }

            return true;
        });
    };

    // Filter enriched top rated by active category
    const filteredTopRated = useMemo(() => {
        return filterByCategory(enrichedTopRated, activeCategory);
    }, [enrichedTopRated, activeCategory]);

    // Filter enriched favorites by active category
    const filteredFavorites = useMemo(() => {
        return filterByCategory(enrichedFavorites, activeCategory);
    }, [enrichedFavorites, activeCategory]);

    // Paginated versions
    const paginatedTopRated = useMemo(() => {
        const start = (topRatedPage - 1) * recipesPerPage;
        return filteredTopRated.slice(start, start + recipesPerPage);
    }, [filteredTopRated, topRatedPage]);

    const paginatedFavorites = useMemo(() => {
        const start = (favoritesPage - 1) * recipesPerPage;
        return filteredFavorites.slice(start, start + recipesPerPage);
    }, [filteredFavorites, favoritesPage]);

    // Reset to page 1 when category changes
    useEffect(() => {
        setTopRatedPage(1);
        setFavoritesPage(1);
    }, [activeCategory]);

    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleCategorySelect = (category) => {
        setActiveCategory(category);
        handleFilterClose();
    };

    // Admin delete functions
    const handleDeleteClick = (type, item) => {
        const deleteInfo = {
            type,
            id: type === 'rating' ? item.id : `${item.userId}-${item.id}`,
            recipeId: item.id,
            userId: item.userId,
            title: item.title
        };
        setDeleteTarget(deleteInfo);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        setDeletingItems(prev => new Set(prev).add(deleteTarget.id));

        try {
            if (deleteTarget.type === 'rating') {
                // Find the actual rating ID from ratings array
                const ratingToDelete = ratings.find(r =>
                    r.recipeId === deleteTarget.recipeId &&
                    r.userId === deleteTarget.userId
                );

                if (ratingToDelete) {
                    await fetch(`http://localhost:5001/ratings/${ratingToDelete.id}`, {
                        method: 'DELETE'
                    });

                    // Update local state
                    setRatings(prev => prev.filter(r => r.id !== ratingToDelete.id));
                }
            } else if (deleteTarget.type === 'favorite') {
                // Find the actual favorite ID from allFavorites array
                const favoriteToDelete = allFavorites.find(f =>
                    f.recipeId === deleteTarget.recipeId &&
                    f.userId === deleteTarget.userId
                );

                if (favoriteToDelete) {
                    await fetch(`http://localhost:5001/favorites/${favoriteToDelete.id}`, {
                        method: 'DELETE'
                    });

                    // Update local state
                    setAllFavorites(prev => prev.filter(f => f.id !== favoriteToDelete.id));
                }
            }
        } catch (error) {
            console.error('Delete failed:', error);
            setError('Failed to delete item. Please try again.');
        } finally {
            setDeletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(deleteTarget.id);
                return newSet;
            });
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
    };

    // Admin edit functions
    const handleEditClick = (type, item) => {
        setEditTarget({ type, item, originalItem: { ...item } });

        if (type === 'rating') {
            setEditStars(item.stars || 5);
        } else if (type === 'favorite') {
            setEditNotes(item.notes || '');
        }

        setEditDialogOpen(true);
    };

    const handleEditConfirm = async () => {
        if (!editTarget) return;

        setIsEditing(true);

        try {
            if (editTarget.type === 'rating') {
                // Find the actual rating from ratings array
                const ratingToEdit = ratings.find(r =>
                    r.recipeId === editTarget.item.id &&
                    r.userId === editTarget.item.userId
                );

                if (ratingToEdit) {
                    const updatedRating = {
                        ...ratingToEdit,
                        stars: editStars,
                        updatedAt: new Date().toISOString()
                    };

                    await fetch(`http://localhost:5001/ratings/${ratingToEdit.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedRating)
                    });

                    // Update local state
                    setRatings(prev => prev.map(r => r.id === ratingToEdit.id ? updatedRating : r));
                }
            } else if (editTarget.type === 'favorite') {
                // Find the actual favorite from allFavorites array
                const favoriteToEdit = allFavorites.find(f =>
                    f.recipeId === editTarget.item.id &&
                    f.userId === editTarget.item.userId
                );

                if (favoriteToEdit) {
                    const updatedFavorite = {
                        ...favoriteToEdit,
                        notes: editNotes
                    };

                    await fetch(`http://localhost:5001/favorites/${favoriteToEdit.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedFavorite)
                    });

                    // Update local state
                    setAllFavorites(prev => prev.map(f => f.id === favoriteToEdit.id ? updatedFavorite : f));
                }
            }
        } catch (error) {
            console.error('Edit failed:', error);
            setError('Failed to update item. Please try again.');
        } finally {
            setIsEditing(false);
            setEditDialogOpen(false);
            setEditTarget(null);
            setEditStars(5);
            setEditNotes('');
        }
    };

    const handleEditCancel = () => {
        setEditDialogOpen(false);
        setEditTarget(null);
        setEditStars(5);
        setEditNotes('');
    };

    const handleUserChange = (event) => {
        setSelectedUserId(event.target.value);
    };

    const getSelectedUserName = () => {
        if (selectedUserId === 'all') return 'All Users';
        const selectedUser = allUsers.find(u => u.id === selectedUserId);
        return selectedUser ? selectedUser.name : 'Unknown User';
    };

    const UserSelector = () => {
        if (!user?.isAdmin) return null;

        return (
            <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
                <InputLabel>Select User</InputLabel>
                <Select
                    value={selectedUserId}
                    label="Select User"
                    onChange={handleUserChange}
                    sx={{
                        bgcolor: 'background.paper',
                        '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }
                    }}
                >
                    <MenuItem value="all">
                        <ListItemIcon>
                            <AdminPanelSettingsIcon sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="All Users" />
                    </MenuItem>
                    <Divider />
                    {allUsers.map((userData) => (
                        <MenuItem key={userData.id} value={userData.id}>
                            <ListItemIcon>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                                    {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={userData.name}
                                secondary={userData.email}
                            />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ pt: 12, pb: 6 }}>
            {view === 'top-rated' && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="h3">
                                Top Rated Recipes
                                {user?.isAdmin && selectedUserId !== 'all' && (
                                    <Typography component="span" variant="h5" sx={{ color: 'text.secondary', ml: 1 }}>
                                        - {getSelectedUserName()}
                                    </Typography>
                                )}
                            </Typography>
                            {(user?.isAdmin && selectedUserId === 'all') || !user?.isAdmin ? (
                                <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    Showing top rated recipes from all users
                                </Typography>
                            ) : null}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <UserSelector />
                            <Chip
                                label={activeCategory.label}
                                icon={<span>{activeCategory.icon}</span>}
                                color={activeCategory.label !== 'All Types' ? "primary" : "default"}
                                sx={{ borderRadius: 2 }}
                            />
                            <IconButton
                                onClick={handleFilterClick}
                                size="small"
                                sx={{
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' }
                                }}
                            >
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    <Menu
                        anchorEl={filterAnchorEl}
                        open={Boolean(filterAnchorEl)}
                        onClose={handleFilterClose}
                        PaperProps={{
                            sx: {
                                maxHeight: 400,
                                width: '250px'
                            }
                        }}
                    >
                        {categories.map((category) => (
                            <MenuItem
                                key={category.label}
                                onClick={() => handleCategorySelect(category)}
                                selected={activeCategory.label === category.label}
                            >
                                <span style={{ marginRight: '8px' }}>{category.icon}</span>
                                {category.label}
                            </MenuItem>
                        ))}
                    </Menu>

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {!loading && !error && filteredTopRated.length === 0 && (
                        <Alert severity="info" sx={{ mb: 3 }}>No recipes with 4-5 star ratings yet. Rate some recipes to see them here!</Alert>
                    )}
                    <RecipeGrid
                        items={paginatedTopRated}
                        renderCard={user?.isAdmin ? (item) => (
                            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                <RecipeCard recipe={item} rating={item.rating} />
                                {user?.isAdmin && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        display: 'flex',
                                        gap: 0.5,
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        borderRadius: 1,
                                        p: 0.5
                                    }}>
                                        <Tooltip title="Edit Rating">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleEditClick('rating', item);
                                                }}
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    '&:hover': { bgcolor: 'primary.dark' }
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Rating">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteClick('rating', item);
                                                }}
                                                disabled={deletingItems.has(item.id)}
                                                sx={{
                                                    bgcolor: 'error.main',
                                                    color: 'white',
                                                    '&:hover': { bgcolor: 'error.dark' },
                                                    '&:disabled': { bgcolor: 'grey.400' }
                                                }}
                                            >
                                                {deletingItems.has(item.id) ?
                                                    <CircularProgress size={16} color="inherit" /> :
                                                    <DeleteIcon fontSize="small" />
                                                }
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>
                        ) : undefined}
                    />

                    {/* Pagination for Top Rated */}
                    {filteredTopRated.length > recipesPerPage && (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            mt: 6,
                            mb: 4,
                            gap: 3,
                            py: 2
                        }}>
                            <Button
                                onClick={() => {
                                    setTopRatedPage(topRatedPage - 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={topRatedPage === 1}
                                variant="contained"
                                startIcon={<ArrowBackIcon />}
                                sx={{
                                    minWidth: '120px',
                                    fontSize: '1rem',
                                    py: 1.5
                                }}
                            >
                                Previous
                            </Button>

                            <Typography variant="h6" sx={{
                                minWidth: '140px',
                                textAlign: 'center',
                                fontWeight: 600,
                                color: 'primary.main'
                            }}>
                                Page {topRatedPage} of {Math.ceil(filteredTopRated.length / recipesPerPage)}
                            </Typography>

                            <Button
                                onClick={() => {
                                    setTopRatedPage(topRatedPage + 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={topRatedPage >= Math.ceil(filteredTopRated.length / recipesPerPage)}
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    minWidth: '120px',
                                    fontSize: '1rem',
                                    py: 1.5
                                }}
                            >
                                Next
                            </Button>
                        </Box>
                    )}
                </>
            )}

            {view === 'favorites' && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="h3">
                                {user?.isAdmin && selectedUserId === 'all' ? 'All User Favorites' :
                                    user?.isAdmin && selectedUserId !== 'all' ? `${getSelectedUserName()}'s Favorites` :
                                        'Your Favorites'}
                            </Typography>
                            {user?.isAdmin && selectedUserId === 'all' && (
                                <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    Showing favorite recipes from all users
                                </Typography>
                            )}
                        </Box>
                        {user && ((Array.isArray(favorites) && favorites.length > 0) ||
                            (user?.isAdmin && currentFavorites.length > 0)) && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <UserSelector />
                                    <Chip
                                        label={activeCategory.label}
                                        icon={<span>{activeCategory.icon}</span>}
                                        color={activeCategory.label !== 'All Types' ? "primary" : "default"}
                                        sx={{ borderRadius: 2 }}
                                    />
                                    <IconButton
                                        onClick={handleFilterClick}
                                        size="small"
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' }
                                        }}
                                    >
                                        <FilterListIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                    </Box>

                    <Menu
                        anchorEl={filterAnchorEl}
                        open={Boolean(filterAnchorEl)}
                        onClose={handleFilterClose}
                        PaperProps={{
                            sx: {
                                maxHeight: 400,
                                width: '250px'
                            }
                        }}
                    >
                        {categories.map((category) => (
                            <MenuItem
                                key={category.label}
                                onClick={() => handleCategorySelect(category)}
                                selected={activeCategory.label === category.label}
                            >
                                <span style={{ marginRight: '8px' }}>{category.icon}</span>
                                {category.label}
                            </MenuItem>
                        ))}
                    </Menu>

                    {!user && (
                        <Alert severity="info" sx={{ mb: 3 }}>Log in to see your favorite recipes here.</Alert>
                    )}
                    {user && !user.isAdmin && (!Array.isArray(favorites) || favorites.length === 0) && (
                        <Alert severity="info" sx={{ mb: 3 }}>You have no favorites yet. Tap the heart on any recipe to add it here.</Alert>
                    )}
                    {user?.isAdmin && currentFavorites.length === 0 && selectedUserId === 'all' && (
                        <Alert severity="info" sx={{ mb: 3 }}>No users have any favorite recipes yet.</Alert>
                    )}
                    {user?.isAdmin && currentFavorites.length === 0 && selectedUserId !== 'all' && (
                        <Alert severity="info" sx={{ mb: 3 }}>{getSelectedUserName()} has no favorite recipes yet.</Alert>
                    )}
                    {((user && !user.isAdmin && Array.isArray(favorites) && favorites.length > 0) ||
                        (user?.isAdmin && currentFavorites.length > 0)) && (
                            <>
                                <RecipeGrid
                                    items={paginatedFavorites}
                                    renderCard={user?.isAdmin ? (item) => (
                                        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                            <RecipeCard recipe={item} />
                                            {user?.isAdmin && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    display: 'flex',
                                                    gap: 0.5,
                                                    bgcolor: 'rgba(255,255,255,0.9)',
                                                    borderRadius: 1,
                                                    p: 0.5
                                                }}>
                                                    <Tooltip title="Edit Favorite">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleEditClick('favorite', item);
                                                            }}
                                                            sx={{
                                                                bgcolor: 'primary.main',
                                                                color: 'white',
                                                                '&:hover': { bgcolor: 'primary.dark' }
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Favorite">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteClick('favorite', item);
                                                            }}
                                                            disabled={deletingItems.has(`${item.userId}-${item.id}`)}
                                                            sx={{
                                                                bgcolor: 'error.main',
                                                                color: 'white',
                                                                '&:hover': { bgcolor: 'error.dark' },
                                                                '&:disabled': { bgcolor: 'grey.400' }
                                                            }}
                                                        >
                                                            {deletingItems.has(`${item.userId}-${item.id}`) ?
                                                                <CircularProgress size={16} color="inherit" /> :
                                                                <DeleteIcon fontSize="small" />
                                                            }
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                            {user?.isAdmin && selectedUserId === 'all' && item.userName && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    bottom: 8,
                                                    left: 8,
                                                    bgcolor: 'rgba(255,159,41,0.9)',
                                                    color: 'white',
                                                    borderRadius: 1,
                                                    px: 1,
                                                    py: 0.25,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600
                                                }}>
                                                    {item.userName}
                                                </Box>
                                            )}
                                        </Box>
                                    ) : undefined}
                                />

                                {/* Pagination for Favorites */}
                                {filteredFavorites.length > recipesPerPage && (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        mt: 6,
                                        mb: 4,
                                        gap: 3,
                                        py: 2
                                    }}>
                                        <Button
                                            onClick={() => {
                                                setFavoritesPage(favoritesPage - 1);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={favoritesPage === 1}
                                            variant="contained"
                                            startIcon={<ArrowBackIcon />}
                                            sx={{
                                                minWidth: '120px',
                                                fontSize: '1rem',
                                                py: 1.5
                                            }}
                                        >
                                            Previous
                                        </Button>

                                        <Typography variant="h6" sx={{
                                            minWidth: '140px',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            color: 'primary.main'
                                        }}>
                                            Page {favoritesPage} of {Math.ceil(filteredFavorites.length / recipesPerPage)}
                                        </Typography>

                                        <Button
                                            onClick={() => {
                                                setFavoritesPage(favoritesPage + 1);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={favoritesPage >= Math.ceil(filteredFavorites.length / recipesPerPage)}
                                            variant="contained"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                minWidth: '120px',
                                                fontSize: '1rem',
                                                py: 1.5
                                            }}
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DeleteIcon color="error" />
                        Confirm Delete
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete this {deleteTarget?.type === 'rating' ? 'rating' : 'favorite'} for "{deleteTarget?.title}"?
                        {deleteTarget?.userId && (
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                User: {allUsers.find(u => u.id === deleteTarget.userId)?.name || 'Unknown'}
                            </Typography>
                        )}
                        <Typography variant="body2" sx={{ mt: 1, color: 'error.main', fontWeight: 500 }}>
                            This action cannot be undone.
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleDeleteCancel} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        disabled={deletingItems.has(deleteTarget?.id)}
                        startIcon={deletingItems.has(deleteTarget?.id) ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {deletingItems.has(deleteTarget?.id) ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                aria-labelledby="edit-dialog-title"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="edit-dialog-title">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditIcon color="primary" />
                        Edit {editTarget?.type === 'rating' ? 'Rating' : 'Favorite'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {editTarget?.type === 'rating' ? <StarIcon color="warning" /> : <FavoriteIcon color="error" />}
                            {editTarget?.item?.title}
                        </Typography>

                        {editTarget?.userId && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                User: {allUsers.find(u => u.id === editTarget.userId)?.name || 'Unknown'}
                            </Typography>
                        )}

                        {editTarget?.type === 'rating' && (
                            <Box>
                                <Typography component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                                    Star Rating
                                </Typography>
                                <Rating
                                    value={editStars}
                                    onChange={(event, newValue) => {
                                        setEditStars(newValue || 1);
                                    }}
                                    size="large"
                                />
                                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                    Current rating: {editStars} star{editStars !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        )}

                        {editTarget?.type === 'favorite' && (
                            <TextField
                                label="Notes"
                                multiline
                                rows={4}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Add notes about this favorite recipe..."
                                fullWidth
                                variant="outlined"
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleEditCancel} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditConfirm}
                        variant="contained"
                        color="primary"
                        disabled={isEditing}
                        startIcon={isEditing ? <CircularProgress size={16} /> : <EditIcon />}
                    >
                        {isEditing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Dashboard;
