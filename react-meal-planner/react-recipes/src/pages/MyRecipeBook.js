import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Alert,
    Select,
    FormControl,
    InputLabel,
    MenuItem,
    Avatar,
    ListItemIcon,
    ListItemText,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    IconButton,
    Tooltip,
    CircularProgress,
    TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RecipeGrid from '../components/RecipeGrid';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../context/AuthContext';
import { getMyRecipes, getAllUsers } from '../services/jsonServerAPI';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MyRecipeBook() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Admin functionality states
    const isAdminView = new URLSearchParams(location.search).get('admin') === 'true' && user?.isAdmin;
    const [allUsers, setAllUsers] = useState([]);
    const [allUserRecipes, setAllUserRecipes] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('all');

    // Admin delete functionality
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingItems, setDeletingItems] = useState(new Set());

    // Admin edit functionality
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editIngredients, setEditIngredients] = useState('');
    const [editInstructions, setEditInstructions] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!user) { setLoading(false); return; }
            setLoading(true);
            setError(null);
            try {
                if (isAdminView) {
                    // Load admin data
                    const usersData = await getAllUsers();
                    const nonAdminUsers = Array.isArray(usersData) ? usersData.filter(u => !u.isAdmin) : [];
                    setAllUsers(nonAdminUsers);

                    // Get all users' recipes
                    const allRecipesPromises = nonAdminUsers.map(async u => {
                        try {
                            const userRecipes = await getMyRecipes(u.id);
                            return Array.isArray(userRecipes) ? userRecipes.map(recipe => ({
                                ...recipe,
                                userId: u.id,
                                userName: u.name
                            })) : [];
                        } catch (e) {
                            console.error(`Failed to load recipes for user ${u.id}:`, e);
                            return [];
                        }
                    });

                    const allRecipesArrays = await Promise.all(allRecipesPromises);
                    const allRecipesFlat = allRecipesArrays.flat();
                    if (mounted) setAllUserRecipes(allRecipesFlat);
                } else {
                    // Regular user view
                    const data = await getMyRecipes(user.id);
                    if (mounted) setRecipes(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                if (mounted) setError(e.message || 'Failed to load recipes');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false };
    }, [user, isAdminView]);

    // Get current user recipes based on admin view and selection
    const currentRecipes = useMemo(() => {
        if (isAdminView) {
            if (selectedUserId === 'all') {
                return allUserRecipes;
            } else {
                return allUserRecipes.filter(r => r.userId === selectedUserId);
            }
        } else {
            return recipes;
        }
    }, [isAdminView, selectedUserId, allUserRecipes, recipes]);

    const items = useMemo(() => {
        return (currentRecipes || []).map(r => ({
            id: r.id,
            title: r.title,
            image: r.image,
            summary: r.summary,
            servings: r.servings,
            readyInMinutes: r.readyInMinutes,
            rating: r.rating,
            dishTypes: r.dishTypes,
            diets: r.diets,
            userId: r.userId,
            userName: r.userName,
            isMine: !isAdminView
        }));
    }, [currentRecipes, isAdminView]);

    const handleUserChange = (event) => {
        setSelectedUserId(event.target.value);
    };

    const getSelectedUserName = () => {
        if (selectedUserId === 'all') return 'All Users';
        const selectedUser = allUsers.find(u => u.id === selectedUserId);
        return selectedUser ? selectedUser.name : 'Unknown User';
    };

    // Admin delete functions
    const handleDeleteClick = (recipe) => {
        setDeleteTarget(recipe);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        setDeletingItems(prev => new Set(prev).add(deleteTarget.id));

        try {
            await fetch(`http://localhost:5001/recipes/${deleteTarget.id}`, {
                method: 'DELETE'
            });

            // Update local state
            setAllUserRecipes(prev => prev.filter(r => r.id !== deleteTarget.id));
            setRecipes(prev => prev.filter(r => r.id !== deleteTarget.id));
        } catch (error) {
            console.error('Delete failed:', error);
            setError('Failed to delete recipe. Please try again.');
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

    // Admin edit functionality
    const handleEditClick = (recipe) => {
        setEditTarget(recipe);
        setEditTitle(recipe.title || '');
        setEditIngredients(Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : recipe.ingredients || '');
        setEditInstructions(recipe.instructions || '');
        setEditDialogOpen(true);
    };

    const handleEditConfirm = async () => {
        if (!editTarget) return;

        setIsEditing(true);

        try {
            const updatedRecipe = {
                ...editTarget,
                title: editTitle,
                ingredients: editIngredients.split('\n').filter(ing => ing.trim()),
                instructions: editInstructions
            };

            await fetch(`http://localhost:5001/myRecipes/${editTarget.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRecipe)
            });

            // Update local state
            setAllUserRecipes(prev => prev.map(r => r.id === editTarget.id ? updatedRecipe : r));
            setRecipes(prev => prev.map(r => r.id === editTarget.id ? updatedRecipe : r));
        } catch (error) {
            console.error('Edit failed:', error);
            setError('Failed to update recipe. Please try again.');
        } finally {
            setIsEditing(false);
            setEditDialogOpen(false);
            setEditTarget(null);
            setEditTitle('');
            setEditIngredients('');
            setEditInstructions('');
        }
    };

    const handleEditCancel = () => {
        setEditDialogOpen(false);
        setEditTarget(null);
        setEditTitle('');
        setEditIngredients('');
        setEditInstructions('');
    };

    const handleRecipeDeleted = (recipeId) => {
        setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipeId));
        setAllUserRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipeId));
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
                                primaryTypographyProps={{
                                    sx: { fontSize: '0.875rem' }
                                }}
                                secondaryTypographyProps={{
                                    sx: { fontSize: '0.75rem' }
                                }}
                            />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ pt: 12, pb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3">
                    {isAdminView
                        ? `${selectedUserId === 'all' ? 'All User Recipe Books' : `${getSelectedUserName()}'s Recipe Book`}`
                        : 'My Recipe Book'
                    }
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UserSelector />
                    {!isAdminView && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/my-recipes/new')}
                            aria-label="Create a new custom recipe"
                        >
                            New Recipe
                        </Button>
                    )}
                </Box>
            </Box>

            {!user && (
                <Alert severity="info" sx={{ mb: 3 }}>Please log in to manage your recipe book.</Alert>
            )}

            {user && !loading && items.length === 0 && !isAdminView && (
                <Alert severity="info" sx={{ mb: 3 }}>Your recipe book is empty. Add recipes from cards or create one from scratch.</Alert>
            )}

            {user && !loading && items.length === 0 && isAdminView && selectedUserId === 'all' && (
                <Alert severity="info" sx={{ mb: 3 }}>No users have created any custom recipes yet.</Alert>
            )}

            {user && !loading && items.length === 0 && isAdminView && selectedUserId !== 'all' && (
                <Alert severity="info" sx={{ mb: 3 }}>{getSelectedUserName()} has no custom recipes yet.</Alert>
            )}

            {/* {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>} */}

            {user && items.length > 0 && (
                <RecipeGrid
                    items={items}
                    renderCard={isAdminView ? (item) => (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                            <RecipeCard
                                recipe={item}
                                rating={item.rating}
                                onDeleted={handleRecipeDeleted}
                            />
                            {isAdminView && (
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
                                    <Tooltip title="Edit Recipe">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleEditClick(item);
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
                                    <Tooltip title="Delete Recipe">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteClick(item);
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
                            {isAdminView && selectedUserId === 'all' && item.userName && (
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
                    ) : (item) => (
                        <RecipeCard
                            recipe={item}
                            rating={item.rating}
                            onDeleted={handleRecipeDeleted}
                        />
                    )}
                />
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
                        Are you sure you want to delete the recipe "{deleteTarget?.title}"?
                        {deleteTarget?.userName && (
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                Created by: {deleteTarget.userName}
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

            {/* Edit Recipe Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={handleEditCancel}
                aria-labelledby="edit-dialog-title"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="edit-dialog-title">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditIcon color="primary" />
                        Edit Recipe
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <TextField
                            label="Recipe Title"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            fullWidth
                            variant="outlined"
                            required
                        />

                        <TextField
                            label="Ingredients"
                            value={editIngredients}
                            onChange={(e) => setEditIngredients(e.target.value)}
                            multiline
                            rows={6}
                            fullWidth
                            variant="outlined"
                            placeholder="Enter each ingredient on a new line..."
                            required
                        />

                        <TextField
                            label="Instructions"
                            value={editInstructions}
                            onChange={(e) => setEditInstructions(e.target.value)}
                            multiline
                            rows={6}
                            fullWidth
                            variant="outlined"
                            placeholder="Enter cooking instructions..."
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleEditCancel} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditConfirm}
                        variant="contained"
                        color="primary"
                        disabled={isEditing || !editTitle.trim() || !editIngredients.trim() || !editInstructions.trim()}
                        startIcon={isEditing ? <CircularProgress size={16} /> : <EditIcon />}
                    >
                        {isEditing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
