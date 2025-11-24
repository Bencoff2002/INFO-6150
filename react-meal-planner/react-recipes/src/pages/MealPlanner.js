import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Menu,
    ListItemIcon,
    ListItemText,
    Alert,
    Fab,
    FormControlLabel,
    Checkbox,
    FormGroup,
    FormLabel,
    Divider,
    Avatar,
    Container
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Restaurant as RestaurantIcon,
    MoreVert as MoreVertIcon,
    AutoFixHigh as AutoPlanIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    Person as PersonIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
    getMealPlans,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    getMyRecipes,
    getWeeklyNotes,
    saveWeeklyNotes,
    getAllUsers,
    getAllFavorites
} from '../services/jsonServerAPI';
import jsonServerAPI from '../services/jsonServerAPI';
import { useNavigate, useLocation } from 'react-router-dom';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function MealPlanner() {
    const { user, favorites } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminView = new URLSearchParams(location.search).get('admin') === 'true' && user?.isAdmin;

    const [mealPlans, setMealPlans] = useState([]);
    const [allMealPlans, setAllMealPlans] = useState([]);
    const [myRecipes, setMyRecipes] = useState([]);
    const [externalRecipes, setExternalRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [autoPlanning, setAutoPlanning] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [alert, setAlert] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
    const [mealPreferences, setMealPreferences] = useState({
        isVegetarian: false,
        isWeightLoss: false,
        allergies: []
    });
    const [allergyInput, setAllergyInput] = useState('');
    const [weeklyNotes, setWeeklyNotes] = useState('');
    const [notesLoading, setNotesLoading] = useState(false);

    // Admin functionality states
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [allUserFavorites, setAllUserFavorites] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        day: '',
        mealType: '',
        recipeId: '',
        recipeTitle: '',
        notes: ''
    });

    const loadData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            if (isAdminView) {
                // Load admin data
                const [usersData, favoritesData] = await Promise.all([
                    getAllUsers(),
                    getAllFavorites()
                ]);

                const nonAdminUsers = Array.isArray(usersData) ? usersData.filter(u => !u.isAdmin) : [];
                setAllUsers(nonAdminUsers);
                setAllUserFavorites(Array.isArray(favoritesData) ? favoritesData : []);

                // Load all meal plans from all users
                const allPlansPromises = nonAdminUsers.map(u => getMealPlans(u.id));
                const allPlansResults = await Promise.all(allPlansPromises);
                const flattenedPlans = allPlansResults.flat().map((plan, index) => ({
                    ...plan,
                    userName: nonAdminUsers.find(u => u.id === plan.userId)?.name || 'Unknown User'
                }));
                setAllMealPlans(flattenedPlans);

                // Set initial user data based on selection
                if (selectedUserId === 'all') {
                    setMealPlans(flattenedPlans);
                } else {
                    const userPlans = flattenedPlans.filter(p => p.userId === selectedUserId);
                    setMealPlans(userPlans);
                }

                setMyRecipes([]); // Admins don't have personal recipes in this view
                setWeeklyNotes('');
            } else {
                // Regular user data loading
                const [plansData, recipesData, notesData, externalRecipesData] = await Promise.all([
                    getMealPlans(user.id),
                    getMyRecipes(user.id),
                    getWeeklyNotes(user.id),
                    jsonServerAPI.get('/externalRecipes').then(res => res.data)
                ]);
                setMealPlans(plansData);
                setMyRecipes(recipesData);
                setWeeklyNotes(notesData?.notes || '');
                setExternalRecipes(externalRecipesData || []);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
            setAlert({ type: 'error', message: 'Failed to load meal plans' });
        } finally {
            setLoading(false);
        }
    }, [user, isAdminView, selectedUserId]);

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/meal-planner' } });
            return;
        }
        loadData();
    }, [user, navigate, loadData]);

    // Update meal plans when user selection changes (admin only)
    useEffect(() => {
        if (isAdminView && allMealPlans.length > 0) {
            if (selectedUserId === 'all') {
                setMealPlans(allMealPlans);
            } else {
                const userPlans = allMealPlans.filter(p => p.userId === selectedUserId);
                setMealPlans(userPlans);
            }
        }
    }, [selectedUserId, allMealPlans, isAdminView]);

    const handleUserChange = (event) => {
        setSelectedUserId(event.target.value);
    };

    const getSelectedUserName = () => {
        if (selectedUserId === 'all') return 'All Users';
        const selectedUser = allUsers.find(u => u.id === selectedUserId);
        return selectedUser ? selectedUser.name : 'Unknown User';
    };

    const UserSelector = () => {
        if (!isAdminView) return null;

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

    // Auto meal planning functions
    const getAllAvailableRecipes = () => {
        const allRecipes = [];

        // Add favorites (external recipes)
        if (favorites && favorites.length > 0) {
            favorites.forEach(fav => {
                allRecipes.push({
                    id: `fav_${fav.recipeId}`,
                    title: fav.title,
                    type: 'favorite',
                    sourceId: fav.recipeId,
                    image: fav.image
                });
            });
        }

        // Add my recipes
        if (myRecipes && myRecipes.length > 0) {
            myRecipes.forEach(recipe => {
                allRecipes.push({
                    id: recipe.id,
                    title: recipe.title,
                    type: 'myRecipe',
                    sourceId: recipe.id,
                    image: recipe.image
                });
            });
        }

        // Add all external recipes from the database (available recipe cards)
        if (externalRecipes && externalRecipes.length > 0) {
            externalRecipes.forEach(recipe => {
                // Only add if not already in favorites to avoid duplicates
                const alreadyInFavorites = favorites?.some(fav => fav.recipeId === recipe.spoonacularId);
                if (!alreadyInFavorites) {
                    allRecipes.push({
                        id: `external_${recipe.spoonacularId}`,
                        title: recipe.title,
                        type: 'external',
                        sourceId: recipe.spoonacularId,
                        image: recipe.image,
                        dishTypes: recipe.dishTypes || [],
                        diets: recipe.diets || []
                    });
                }
            });
        }

        return allRecipes;
    };

    const filterRecipesByPreferences = (recipes) => {
        let filteredRecipes = [...recipes];

        // Filter for vegetarian
        if (mealPreferences.isVegetarian) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                const title = recipe.title.toLowerCase();
                // Exclude recipes with meat keywords
                return !title.includes('beef') && !title.includes('chicken') &&
                    !title.includes('pork') && !title.includes('fish') &&
                    !title.includes('turkey') && !title.includes('bacon') &&
                    !title.includes('ham') && !title.includes('sausage') &&
                    !title.includes('steak') && !title.includes('lamb');
            });
        }

        // Filter for weight loss (prefer lighter meals)
        if (mealPreferences.isWeightLoss) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                const title = recipe.title.toLowerCase();
                // Exclude high-calorie keywords
                return !title.includes('fried') && !title.includes('creamy') &&
                    !title.includes('butter') && !title.includes('cheese') &&
                    !title.includes('chocolate') && !title.includes('cake') &&
                    !title.includes('pizza') && !title.includes('burger');
            });
        }

        // Filter for allergies
        if (mealPreferences.allergies.length > 0) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                const title = recipe.title.toLowerCase();
                return !mealPreferences.allergies.some(allergy =>
                    title.includes(allergy.toLowerCase())
                );
            });
        }

        return filteredRecipes;
    };

    const categorizeRecipesByMealType = (recipes) => {
        const breakfast = [];
        const lunch = [];
        const dinner = [];
        const snack = [];

        recipes.forEach(recipe => {
            const title = recipe.title.toLowerCase();

            // Breakfast keywords - expanded list
            if (title.includes('pancake') || title.includes('toast') || title.includes('breakfast') ||
                title.includes('cereal') || title.includes('oats') || title.includes('oatmeal') ||
                title.includes('smoothie') || title.includes('egg') || title.includes('bagel') ||
                title.includes('waffle') || title.includes('muffin') || title.includes('croissant') ||
                title.includes('yogurt') || title.includes('granola') || title.includes('brunch') ||
                title.includes('french toast') || title.includes('omelet') || title.includes('omelette') ||
                title.includes('bacon') || title.includes('sausage') || title.includes('hash') ||
                title.includes('porridge') || title.includes('crepe') || title.includes('scone') ||
                title.includes('biscuit') || title.includes('parfait') || title.includes('bowl')) {
                breakfast.push(recipe);
            }
            // Snack keywords  
            else if (title.includes('snack') || title.includes('chip') || title.includes('cookie') ||
                title.includes('bar') || title.includes('nuts') || title.includes('fruit') ||
                title.includes('dessert') || title.includes('cake') || title.includes('pie')) {
                snack.push(recipe);
            }
            // Dinner keywords (heavier meals)
            else if (title.includes('steak') || title.includes('roast') || title.includes('pasta') ||
                title.includes('curry') || title.includes('soup') || title.includes('stew') ||
                title.includes('casserole') || title.includes('lasagna') || title.includes('pizza')) {
                dinner.push(recipe);
            }
            // Protein-heavy meals can work for any meal but default to lunch/dinner
            else if (title.includes('chicken') || title.includes('beef') || title.includes('pork') ||
                title.includes('salmon') || title.includes('fish') || title.includes('turkey') ||
                title.includes('shrimp') || title.includes('tuna') || title.includes('lamb')) {
                // Add to both lunch and dinner for flexibility
                lunch.push(recipe);
                dinner.push(recipe);
            }
            // Default to lunch
            else {
                lunch.push(recipe);
            }
        });

        return { breakfast, lunch, dinner, snack };
    };

    const generateRandomMealPlan = async () => {
        try {
            setAutoPlanning(true);
            const availableRecipes = getAllAvailableRecipes();

            if (availableRecipes.length === 0) {
                setAlert({
                    type: 'warning',
                    message: 'No recipes available! Please add some favorites or create custom recipes first.'
                });
                return;
            }

            // Filter recipes based on user preferences
            const filteredRecipes = filterRecipesByPreferences(availableRecipes);

            if (filteredRecipes.length === 0) {
                setAlert({
                    type: 'warning',
                    message: 'No recipes match your preferences. Please adjust your dietary preferences or add more suitable recipes.'
                });
                return;
            }

            const categorizedRecipes = categorizeRecipesByMealType(filteredRecipes);
            const newMealPlans = [];

            // Track used recipes to ensure variety
            const usedRecipes = {
                breakfast: new Set(),
                lunch: new Set(),
                dinner: new Set()
            };

            // Helper function to get random recipe avoiding duplicates when possible
            const getRandomRecipe = (recipePool, usedSet) => {
                if (recipePool.length === 0) return null;

                // If we have more recipes than days, avoid duplicates
                const availableRecipes = recipePool.filter(r => !usedSet.has(r.title));

                // If all recipes have been used or pool is small, allow reuse
                const poolToUse = availableRecipes.length > 0 ? availableRecipes : recipePool;

                const selected = poolToUse[Math.floor(Math.random() * poolToUse.length)];
                usedSet.add(selected.title);
                return selected;
            };

            DAYS_OF_WEEK.forEach(day => {
                // Generate breakfast - with fallback to general recipes if no breakfast-specific recipes
                const breakfastRecipes = categorizedRecipes.breakfast.length > 0
                    ? categorizedRecipes.breakfast
                    : filteredRecipes; // Fallback to all filtered recipes

                if (breakfastRecipes.length > 0) {
                    const randomBreakfast = getRandomRecipe(breakfastRecipes, usedRecipes.breakfast);
                    if (randomBreakfast) {
                        newMealPlans.push({
                            userId: user.id,
                            title: randomBreakfast.title,
                            day,
                            mealType: 'Breakfast',
                            recipeId: randomBreakfast.type === 'myRecipe' ? randomBreakfast.id : null,
                            recipeTitle: randomBreakfast.title,
                            notes: getRecipeSourceNote(randomBreakfast)
                        });
                    }
                }

                // Generate lunch
                const lunchRecipes = categorizedRecipes.lunch.length > 0 ? categorizedRecipes.lunch : filteredRecipes;
                if (lunchRecipes.length > 0) {
                    const randomLunch = getRandomRecipe(lunchRecipes, usedRecipes.lunch);
                    if (randomLunch) {
                        newMealPlans.push({
                            userId: user.id,
                            title: randomLunch.title,
                            day,
                            mealType: 'Lunch',
                            recipeId: randomLunch.type === 'myRecipe' ? randomLunch.id : null,
                            recipeTitle: randomLunch.title,
                            notes: getRecipeSourceNote(randomLunch)
                        });
                    }
                }

                // Generate dinner
                const dinnerRecipes = categorizedRecipes.dinner.length > 0 ? categorizedRecipes.dinner : filteredRecipes;
                if (dinnerRecipes.length > 0) {
                    const randomDinner = getRandomRecipe(dinnerRecipes, usedRecipes.dinner);
                    if (randomDinner) {
                        newMealPlans.push({
                            userId: user.id,
                            title: randomDinner.title,
                            day,
                            mealType: 'Dinner',
                            recipeId: randomDinner.type === 'myRecipe' ? randomDinner.id : null,
                            recipeTitle: randomDinner.title,
                            notes: getRecipeSourceNote(randomDinner)
                        });
                    }
                }
            });

            // Clear existing meal plans and create new ones
            await Promise.all(mealPlans.map(plan => deleteMealPlan(plan.id)));
            await Promise.all(newMealPlans.map(plan => createMealPlan(plan)));

            setAlert({ type: 'success', message: 'Automatic meal plan generated successfully!' });
            loadData();
        } catch (err) {
            console.error('Auto planning failed:', err);
            setAlert({ type: 'error', message: 'Failed to generate automatic meal plan' });
        } finally {
            setAutoPlanning(false);
        }
    };

    const getRecipeSourceNote = (recipe) => {
        switch (recipe.type) {
            case 'favorite':
                return 'From favorites';
            case 'myRecipe':
                return 'From my recipes';
            case 'external':
                return 'External recipe';
            default:
                return '';
        }
    };

    const handleAutoPlanClick = () => {
        setPreferencesDialogOpen(true);
    };

    const handlePreferencesSubmit = () => {
        setPreferencesDialogOpen(false);
        generateRandomMealPlan();
    };

    const handleAddAllergy = () => {
        if (allergyInput.trim() && !mealPreferences.allergies.includes(allergyInput.trim())) {
            setMealPreferences(prev => ({
                ...prev,
                allergies: [...prev.allergies, allergyInput.trim()]
            }));
            setAllergyInput('');
        }
    };

    const handleRemoveAllergy = (allergyToRemove) => {
        setMealPreferences(prev => ({
            ...prev,
            allergies: prev.allergies.filter(allergy => allergy !== allergyToRemove)
        }));
    };

    const handleSaveNotes = async () => {
        try {
            setNotesLoading(true);
            await saveWeeklyNotes(user.id, weeklyNotes);
            setAlert({ type: 'success', message: 'Weekly notes saved successfully!' });
        } catch (err) {
            console.error('Failed to save notes:', err);
            setAlert({ type: 'error', message: 'Failed to save weekly notes' });
        } finally {
            setNotesLoading(false);
        }
    };

    const handleOpenDialog = (planOrDay = null, mealType = null) => {
        // If first parameter is a plan object (has .id), treat as editing
        if (planOrDay && typeof planOrDay === 'object' && planOrDay.id) {
            const plan = planOrDay;
            setEditingPlan(plan);
            setFormData({
                title: plan.title || '',
                day: plan.day || '',
                mealType: plan.mealType || '',
                recipeId: plan.recipeId || '',
                recipeTitle: plan.recipeTitle || '',
                notes: plan.notes || ''
            });
        } else {
            // Otherwise, treat as adding new with optional day and mealType pre-filled
            setEditingPlan(null);
            setFormData({
                title: '',
                day: typeof planOrDay === 'string' ? planOrDay : DAYS_OF_WEEK[0],
                mealType: mealType || '',
                recipeId: '',
                recipeTitle: '',
                notes: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingPlan(null);
        setFormData({
            title: '',
            day: '',
            mealType: '',
            recipeId: '',
            recipeTitle: '',
            notes: ''
        });
    };

    const handleInputChange = (field, value) => {
        console.log(`Updating ${field} to:`, value); // Debug log
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            console.log('Form data updated:', updated); // Debug log
            return updated;
        });

        // If a recipe is selected, auto-fill the title
        if (field === 'recipeId' && value) {
            const recipe = myRecipes.find(r => r.id === value);
            if (recipe) {
                setFormData(prev => ({
                    ...prev,
                    recipeTitle: recipe.title,
                    title: prev.title || recipe.title
                }));
            }
        } else if (field === 'recipeId' && !value) {
            // Clear recipe title when no recipe is selected
            setFormData(prev => ({
                ...prev,
                recipeTitle: ''
            }));
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.title || !formData.day || !formData.mealType) {
                setAlert({ type: 'error', message: 'Please fill in all required fields' });
                return;
            }

            const planData = {
                userId: user.id,
                title: formData.title,
                day: formData.day,
                mealType: formData.mealType,
                recipeId: formData.recipeId || null,
                recipeTitle: formData.recipeTitle || '',
                notes: formData.notes || ''
            };

            if (editingPlan) {
                await updateMealPlan(editingPlan.id, planData);
                setAlert({ type: 'success', message: 'Meal plan updated successfully!' });
            } else {
                await createMealPlan(planData);
                setAlert({ type: 'success', message: 'Meal plan created successfully!' });
            }

            handleCloseDialog();
            loadData();
        } catch (err) {
            console.error('Save failed:', err);
            setAlert({ type: 'error', message: 'Failed to save meal plan' });
        }
    };

    const handleMenuOpen = (event, plan) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedPlan(plan);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedPlan(null);
    };

    const handleEdit = () => {
        handleOpenDialog(selectedPlan);
        handleMenuClose();
    };

    const handleDelete = async () => {
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const confirmDelete = async () => {
        try {
            await deleteMealPlan(selectedPlan.id);
            setAlert({ type: 'success', message: 'Meal plan deleted successfully!' });
            setDeleteDialogOpen(false);
            setSelectedPlan(null);
            loadData();
        } catch (err) {
            console.error('Delete failed:', err);
            setAlert({ type: 'error', message: 'Failed to delete meal plan' });
            setDeleteDialogOpen(false);
        }
    };

    const cancelDelete = () => {
        setDeleteDialogOpen(false);
        setSelectedPlan(null);
    };

    const handleMealClick = (plan, event) => {
        // Prevent triggering when clicking the menu button
        if (event.target.closest('.meal-menu-button')) {
            return;
        }

        // If the meal has a linked recipe from My Recipe Book, navigate to it
        if (plan.recipeId) {
            navigate(`/my-recipes/${plan.recipeId}`, {
                state: { from: '/meal-planner', fromName: 'Meal Planner' }
            });
        }
    };

    const getMealPlansByDayAndType = (day, mealType) => {
        return mealPlans.filter(plan => plan.day === day && plan.mealType === mealType);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Typography>Loading meal plans...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, pt: 10, maxWidth: '1200px', mx: 'auto' }}>
            {alert && (
                <Alert
                    severity={alert.type}
                    onClose={() => setAlert(null)}
                    sx={{ mb: 2 }}
                >
                    {alert.message}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        {isAdminView ? 'Admin Meal Planner' : 'Meal Planner'}
                        {isAdminView && selectedUserId !== 'all' && (
                            <Typography component="span" variant="h6" sx={{ color: 'text.secondary', ml: 1 }}>
                                - {getSelectedUserName()}
                            </Typography>
                        )}
                    </Typography>
                    {isAdminView && selectedUserId === 'all' && (
                        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Viewing meal plans from all users
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        {(() => {
                            const today = new Date();
                            return today.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            });
                        })()}
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        {(() => {
                            const today = new Date();
                            const monthName = today.toLocaleDateString('en-US', { month: 'long' });
                            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                            const dayOfMonth = today.getDate();
                            const dayOfWeek = firstDayOfMonth.getDay();
                            const weekNumber = Math.ceil((dayOfMonth + dayOfWeek) / 7);
                            return `${monthName} - Week ${weekNumber}`;
                        })()}
                    </Button>
                    <UserSelector />
                    {!isAdminView && (
                        <>
                            {mealPlans.length > 0 && (
                                <Button
                                    variant="outlined"
                                    startIcon={<SaveIcon />}
                                    onClick={() => {
                                        setAlert({ type: 'success', message: 'Meal plan saved successfully!' });
                                        setTimeout(() => setAlert(null), 3000);
                                    }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Save Week
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                startIcon={<AutoPlanIcon />}
                                onClick={handleAutoPlanClick}
                                disabled={autoPlanning || loading}
                                sx={{ borderRadius: 2 }}
                            >
                                {autoPlanning ? 'Generating...' : 'Auto Plan'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                sx={{ borderRadius: 2 }}
                            >
                                Add Meal
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Empty State */}
            {!loading && mealPlans.length === 0 && (
                <Paper sx={{ p: 4, mb: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
                    <RestaurantIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                        {isAdminView
                            ? selectedUserId === 'all'
                                ? 'No meal plans from any users yet'
                                : `${getSelectedUserName()} has no meal plans yet`
                            : 'No meals planned yet'
                        }
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                        {isAdminView
                            ? 'Users can create meal plans by using Auto Plan or manually adding meals.'
                            : 'Start by adding some favorite recipes or create your own custom recipes, then use Auto Plan to generate a meal plan!'
                        }
                    </Typography>
                    {!isAdminView && (
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<AutoPlanIcon />}
                                onClick={handleAutoPlanClick}
                                disabled={autoPlanning}
                            >
                                {autoPlanning ? 'Generating...' : 'Auto Plan Week'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                            >
                                Add Manual Meal
                            </Button>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Weekly Meal Plan - Table Style */}
            <Paper sx={{ p: 2, mb: 3, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                <Box sx={{ overflowX: 'auto', pb: 2 }}>
                    <Box sx={{ display: 'table', width: '100%', minWidth: '900px', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '8px' }}>
                        {/* Header Row with Days */}
                        <Box sx={{ display: 'table-row' }}>
                            <Box sx={{
                                display: 'table-cell',
                                width: '12.5%',
                                height: '60px',
                                p: 1.5,
                                verticalAlign: 'middle',
                                textAlign: 'center',
                                backgroundColor: '#ffffff',
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.85rem' }}>
                                    Meal Type
                                </Typography>
                            </Box>
                            {DAYS_OF_WEEK.map(day => (
                                <Box key={day} sx={{
                                    display: 'table-cell',
                                    width: '12.5%',
                                    height: '60px',
                                    p: 1.5,
                                    verticalAlign: 'middle',
                                    textAlign: 'center',
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                        {day.substring(0, 3).toUpperCase()}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Meal Type Rows */}
                        {MEAL_TYPES.map((mealType) => (
                            <Box key={mealType} sx={{ display: 'table-row' }}>
                                {/* Meal Type Label */}
                                <Box sx={{
                                    display: 'table-cell',
                                    width: '12.5%',
                                    height: '120px',
                                    p: 1.5,
                                    verticalAlign: 'middle',
                                    textAlign: 'center',
                                    backgroundColor: '#ffffff',
                                    borderRadius: 1,
                                    border: '1px solid #e0e0e0'
                                }}>
                                    <Typography variant="subtitle2" sx={{
                                        fontWeight: 'bold',
                                        color: 'primary.main',
                                        fontSize: '0.85rem'
                                    }}>
                                        {mealType}
                                    </Typography>
                                </Box>

                                {/* Days */}
                                {DAYS_OF_WEEK.map(day => {
                                    const plans = getMealPlansByDayAndType(day, mealType);
                                    return (
                                        <Box key={day} sx={{
                                            display: 'table-cell',
                                            width: '12.5%',
                                            height: '120px',
                                            p: 1,
                                            verticalAlign: 'top',
                                            backgroundColor: '#ffffff',
                                            borderRadius: 1,
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            {plans.length > 0 ? (
                                                plans.map(plan => (
                                                    <Box
                                                        key={plan.id}
                                                        onClick={(e) => handleMealClick(plan, e)}
                                                        sx={{
                                                            p: 1.5,
                                                            height: '100%',
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                            transition: 'all 0.2s ease',
                                                            overflow: 'hidden',
                                                            '&:hover': {
                                                                backgroundColor: 'primary.light',
                                                                borderRadius: 1
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ position: 'relative', height: '100%' }}>
                                                            <Typography variant="body2" sx={{
                                                                fontWeight: 'medium',
                                                                fontSize: '0.8rem',
                                                                lineHeight: 1.3,
                                                                pr: 2.5,
                                                                wordBreak: 'break-word',
                                                                overflow: 'hidden',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {plan.title}
                                                            </Typography>
                                                            {isAdminView && plan.userName && (
                                                                <Typography variant="caption" sx={{
                                                                    color: 'primary.main',
                                                                    display: 'block',
                                                                    mt: 0.5,
                                                                    fontSize: '0.65rem',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    👤 {plan.userName}
                                                                </Typography>
                                                            )}
                                                            {plan.notes && (
                                                                <Typography variant="caption" sx={{
                                                                    color: 'text.secondary',
                                                                    fontStyle: 'italic',
                                                                    display: 'block',
                                                                    mt: 0.5,
                                                                    fontSize: '0.65rem',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {plan.notes}
                                                                </Typography>
                                                            )}
                                                            <IconButton
                                                                className="meal-menu-button"
                                                                size="small"
                                                                onClick={(e) => handleMenuOpen(e, plan)}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: -4,
                                                                    right: -4,
                                                                    padding: 0.5,
                                                                    backgroundColor: 'white',
                                                                    boxShadow: 1,
                                                                    '&:hover': {
                                                                        backgroundColor: 'grey.100'
                                                                    }
                                                                }}
                                                            >
                                                                <MoreVertIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Box sx={{
                                                    p: 1.5,
                                                    height: '100%',
                                                    border: '1px dashed #ccc',
                                                    borderRadius: 1,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    '&:hover': {
                                                        backgroundColor: 'grey.100',
                                                        borderColor: 'primary.main'
                                                    }
                                                }}
                                                    onClick={() => handleOpenDialog(day, mealType)}
                                                >
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                        + Add
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Weekly Notes Section */}
                <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid', borderColor: 'grey.200' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                        📝 Weekly Notes & Shopping List
                    </Typography>
                    <TextField
                        multiline
                        rows={6}
                        fullWidth
                        variant="outlined"
                        placeholder="Add weekly notes, shopping lists, or meal prep thoughts..."
                        value={weeklyNotes}
                        onChange={(e) => setWeeklyNotes(e.target.value)}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'white'
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSaveNotes}
                        disabled={notesLoading}
                    >
                        {notesLoading ? 'Saving...' : 'Save Notes'}
                    </Button>
                </Box>
            </Paper>            {/* Floating Action Button for mobile */}
            <Fab
                color="primary"
                onClick={() => handleOpenDialog()}
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', md: 'none' }
                }}
            >
                <AddIcon />
            </Fab>

            {/* Add/Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '400px' }
                }}
            >
                <DialogTitle>
                    {editingPlan ? 'Edit Meal Plan' : 'Add New Meal Plan'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Meal Title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            fullWidth
                            required
                            variant="outlined"
                            autoFocus
                            placeholder="e.g., Grilled Chicken Salad"
                        />

                        <FormControl fullWidth required>
                            <InputLabel id="day-label">Day</InputLabel>
                            <Select
                                labelId="day-label"
                                value={formData.day}
                                onChange={(e) => handleInputChange('day', e.target.value)}
                                label="Day"
                            >
                                {DAYS_OF_WEEK.map(day => (
                                    <MenuItem key={day} value={day}>{day}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel id="meal-type-label">Meal Type</InputLabel>
                            <Select
                                labelId="meal-type-label"
                                value={formData.mealType}
                                onChange={(e) => handleInputChange('mealType', e.target.value)}
                                label="Meal Type"
                            >
                                {MEAL_TYPES.map(type => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel id="recipe-label">Recipe (Optional)</InputLabel>
                            <Select
                                labelId="recipe-label"
                                value={formData.recipeId}
                                onChange={(e) => handleInputChange('recipeId', e.target.value)}
                                label="Recipe (Optional)"
                            >
                                <MenuItem value="">None</MenuItem>
                                {myRecipes.map(recipe => (
                                    <MenuItem key={recipe.id} value={recipe.id}>
                                        {recipe.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            placeholder="Add any special notes or instructions..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 1 }}>
                    <Button onClick={handleCloseDialog} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!formData.title || !formData.day || !formData.mealType}
                    >
                        {editingPlan ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            {/* Meal Preferences Dialog */}
            <Dialog
                open={preferencesDialogOpen}
                onClose={() => setPreferencesDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Meal Planning Preferences</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Set your dietary preferences to customize your meal plan.
                        </Typography>

                        <FormGroup sx={{ mb: 3 }}>
                            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Dietary Preferences
                            </FormLabel>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={mealPreferences.isVegetarian}
                                        onChange={(e) => setMealPreferences(prev => ({
                                            ...prev,
                                            isVegetarian: e.target.checked
                                        }))}
                                    />
                                }
                                label="Vegetarian (exclude meat and fish)"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={mealPreferences.isWeightLoss}
                                        onChange={(e) => setMealPreferences(prev => ({
                                            ...prev,
                                            isWeightLoss: e.target.checked
                                        }))}
                                    />
                                }
                                label="Weight loss focus (exclude high-calorie foods)"
                            />
                        </FormGroup>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Allergies & Restrictions
                            </FormLabel>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Add ingredients or foods you want to avoid.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField
                                    size="small"
                                    label="Add allergy/restriction"
                                    value={allergyInput}
                                    onChange={(e) => setAllergyInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddAllergy();
                                        }
                                    }}
                                    placeholder="e.g., nuts, dairy, gluten"
                                    sx={{ flexGrow: 1 }}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleAddAllergy}
                                    disabled={!allergyInput.trim()}
                                >
                                    Add
                                </Button>
                            </Box>

                            {mealPreferences.allergies.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {mealPreferences.allergies.map((allergy, index) => (
                                        <Chip
                                            key={index}
                                            label={allergy}
                                            onDelete={() => handleRemoveAllergy(allergy)}
                                            size="small"
                                            color="secondary"
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreferencesDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePreferencesSubmit}
                        variant="contained"
                    >
                        Generate Meal Plan
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={cancelDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">Delete Meal Plan?</DialogTitle>
                <DialogContent>
                    <Typography id="delete-dialog-description">
                        Are you sure you want to delete "{selectedPlan?.title}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default MealPlanner;