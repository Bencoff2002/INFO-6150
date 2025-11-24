import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Grid, Card, CardMedia, CardContent, CardActions,
    Button, Chip, Alert, CircularProgress, IconButton, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { stripHtml } from '../utils/htmlUtils';

function SharedRecipes() {
    const { user, favorites, addFavorite, removeFavorite } = useAuth();
    const navigate = useNavigate();
    const [sharedRecipes, setSharedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const recipesPerPage = 9; // 3x3 grid

    useEffect(() => {
        fetchSharedRecipes();
    }, []);

    const fetchSharedRecipes = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/sharedRecipes');
            if (!response.ok) throw new Error('Failed to fetch shared recipes');

            const recipes = await response.json();
            // Sort by most recent first
            const sortedRecipes = recipes.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
            setSharedRecipes(sortedRecipes);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load shared recipes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecipe = (recipe) => {
        // Redirect to login if user is not logged in
        if (!user) {
            navigate('/login', { state: { from: '/shared-recipes' } });
            return;
        }

        // Increment view count before navigating (only for logged-in users)
        incrementViewCount(recipe.id);
        // Navigate to the original recipe
        navigate(`/recipe/${recipe.recipeId}`);
    };

    const handleViewDetails = (recipe) => {
        // Redirect to login if user is not logged in
        if (!user) {
            navigate('/login', { state: { from: '/shared-recipes' } });
            return;
        }

        setSelectedRecipe(recipe);
        setViewDetailsOpen(true);
        // Increment view count (only for logged-in users)
        incrementViewCount(recipe.id);
    };

    const incrementViewCount = async (sharedRecipeId) => {
        try {
            // Don't count views from non-logged-in users
            if (!user) {
                return;
            }

            const recipe = sharedRecipes.find(r => r.id === sharedRecipeId);
            if (recipe) {
                // Don't increment view count if the viewer is the recipe owner
                if (recipe.userId === user.id) {
                    return;
                }

                // Check if this user has already viewed this recipe
                const viewedBy = recipe.viewedBy || [];
                const currentUserId = user.id;

                // If user hasn't viewed this recipe before, increment the count
                if (!viewedBy.includes(currentUserId)) {
                    const updatedRecipe = {
                        ...recipe,
                        viewCount: (recipe.viewCount || 0) + 1,
                        viewedBy: [...viewedBy, currentUserId]
                    };

                    await fetch(`http://localhost:5001/sharedRecipes/${sharedRecipeId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedRecipe)
                    });

                    // Update local state
                    setSharedRecipes(prev => prev.map(r =>
                        r.id === sharedRecipeId ? updatedRecipe : r
                    ));
                }
            }
        } catch (err) {
            console.error('Failed to update view count:', err);
        }
    };

    const handleToggleFavorite = async (e, recipe) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login', { state: { from: '/shared-recipes' } });
            return;
        }

        const recipeData = {
            id: recipe.recipeId,
            title: recipe.recipeTitle,
            image: recipe.recipeImage,
            summary: recipe.recipeSummary
        };

        const fav = favorites?.find((f) => f.recipeId === recipe.recipeId);

        if (fav) {
            await removeFavorite(fav.id);
        } else {
            await addFavorite(recipeData);
        }
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Recently';
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 700 }}>
                    Community Shared Recipes
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                    Discover amazing recipes shared by our community members. Find inspiration and save your favorites!
                </Typography>
                <Chip
                    icon={<ShareIcon />}
                    label={`${sharedRecipes.length} Recipe${sharedRecipes.length !== 1 ? 's' : ''} Shared`}
                    color="primary"
                    variant="outlined"
                />
            </Box>

            {!user && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    You're browsing as a guest. Please login to view recipe details and add favorites!
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!loading && sharedRecipes.length === 0 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    No recipes have been shared yet. Be the first to share a recipe with the community!
                </Alert>
            )}

            <Grid container spacing={3}>
                {sharedRecipes
                    .slice((currentPage - 1) * recipesPerPage, currentPage * recipesPerPage)
                    .map((recipe) => {
                        const fav = favorites?.find((f) => f.recipeId === recipe.recipeId);

                        return (
                            <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                            '& .hover-element': {
                                                opacity: 1
                                            },
                                            '& .bottom-actions': {
                                                transform: 'translateY(-8px)'
                                            }
                                        },
                                        cursor: recipe.userId === user?.id ? 'default' : 'pointer'
                                    }}
                                    onClick={() => {
                                        // Only allow click-to-view for other users' recipes
                                        if (recipe.userId !== user?.id) {
                                            handleViewDetails(recipe);
                                        }
                                    }}
                                >
                                    <Box sx={{ position: 'relative' }}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={recipe.recipeImage}
                                            alt={recipe.recipeTitle}
                                            sx={{ objectFit: 'cover' }}
                                        />

                                        {/* View count badge */}
                                        <Chip
                                            icon={<VisibilityIcon />}
                                            label={recipe.viewCount || 0}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 8,
                                                bgcolor: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                '& .MuiChip-icon': { color: 'white' }
                                            }}
                                        />

                                        {/* "Your Recipe" badge for user's own shared recipes */}
                                        {recipe.userId === user?.id && (
                                            <Chip
                                                label="Your Recipe"
                                                size="small"
                                                className="hover-element"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    left: recipe.viewCount ? 80 : 8, // Position based on view count badge
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    height: 24,
                                                    opacity: 0,
                                                    transition: 'opacity 0.3s ease-in-out'
                                                }}
                                            />
                                        )}

                                        {/* Favorite button */}
                                        <IconButton
                                            onClick={(e) => handleToggleFavorite(e, recipe)}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                '&:hover': {
                                                    backgroundColor: 'white',
                                                    transform: 'scale(1.1)'
                                                }
                                            }}
                                        >
                                            <FavoriteIcon
                                                sx={{
                                                    color: fav ? '#FF9F00' : 'action.disabled'
                                                }}
                                            />
                                        </IconButton>
                                    </Box>

                                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                        <Typography
                                            variant="h6"
                                            component="h3"
                                            sx={{
                                                fontWeight: 600,
                                                mb: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {recipe.recipeTitle}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: 'text.secondary',
                                                mb: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {stripHtml(recipe.recipeSummary) || 'No description available'}
                                        </Typography>

                                        {/* Share message */}
                                        {recipe.shareMessage && (
                                            <Typography
                                                className="hover-element"
                                                variant="body2"
                                                sx={{
                                                    fontStyle: 'italic',
                                                    color: 'primary.main',
                                                    mb: 1,
                                                    p: 1,
                                                    bgcolor: 'action.hover',
                                                    borderRadius: 1,
                                                    fontSize: '0.85rem',
                                                    opacity: 0,
                                                    transition: 'opacity 0.3s ease-in-out'
                                                }}
                                            >
                                                "{recipe.shareMessage}"
                                            </Typography>
                                        )}

                                        {/* Shared by user info */}
                                        <Box
                                            className="hover-element"
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 1,
                                                opacity: 0,
                                                transition: 'opacity 0.3s ease-in-out'
                                            }}
                                        >
                                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                                {recipe.userName ? recipe.userName.charAt(0).toUpperCase() : 'U'}
                                            </Avatar>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {recipe.userId === user?.id ? (
                                                    <>Shared by <strong>You</strong></>
                                                ) : (
                                                    <>Shared by <strong>{recipe.userName}</strong></>
                                                )}
                                            </Typography>
                                        </Box>

                                        <Box
                                            className="hover-element"
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                opacity: 0,
                                                transition: 'opacity 0.3s ease-in-out'
                                            }}
                                        >
                                            <AccessTimeIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {formatTimeAgo(recipe.sharedAt)}
                                            </Typography>
                                        </Box>
                                    </CardContent>

                                    <CardActions
                                        className="bottom-actions"
                                        sx={{
                                            pt: 0,
                                            px: 2,
                                            pb: 2,
                                            transform: 'translateY(0px)',
                                            transition: 'transform 0.3s ease-in-out'
                                        }}
                                    >
                                        {recipe.userId !== user?.id ? (
                                            // Show "View Recipe" button only for recipes shared by other users
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                fullWidth
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewRecipe(recipe);
                                                }}
                                            >
                                                {user ? 'View Recipe' : 'Login to View'}
                                            </Button>
                                        ) : (
                                            // Show view count info for user's own shared recipes
                                            <Box sx={{
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: 1,
                                                py: 1,
                                                px: 2,
                                                bgcolor: 'action.hover',
                                                borderRadius: 1
                                            }}>
                                                <VisibilityIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                    {recipe.viewCount || 0} view{(recipe.viewCount || 0) !== 1 ? 's' : ''} on your shared recipe
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
            </Grid>

            {/* Pagination */}
            {sharedRecipes.length > recipesPerPage && (
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
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
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
                        Page {currentPage} of {Math.ceil(sharedRecipes.length / recipesPerPage)}
                    </Typography>

                    <Button
                        onClick={() => {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage >= Math.ceil(sharedRecipes.length / recipesPerPage)}
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

            {/* Recipe Details Dialog */}
            <Dialog
                open={viewDetailsOpen}
                onClose={() => setViewDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedRecipe && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <img
                                    src={selectedRecipe.recipeImage}
                                    alt={selectedRecipe.recipeTitle}
                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                                />
                                <Box>
                                    <Typography variant="h6">{selectedRecipe.recipeTitle}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Shared by {selectedRecipe.userName}
                                    </Typography>
                                </Box>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body1" paragraph>
                                    {stripHtml(selectedRecipe.recipeSummary)}
                                </Typography>

                                {selectedRecipe.shareMessage && (
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: 'action.hover',
                                        borderRadius: 1,
                                        mb: 2,
                                        borderLeft: 4,
                                        borderColor: 'primary.main'
                                    }}>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                            "{selectedRecipe.shareMessage}"
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                                    <Chip
                                        icon={<VisibilityIcon />}
                                        label={`${selectedRecipe.viewCount || 0} views`}
                                        size="small"
                                    />
                                    <Chip
                                        icon={<AccessTimeIcon />}
                                        label={formatTimeAgo(selectedRecipe.sharedAt)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setViewDetailsOpen(false)}>
                                Close
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setViewDetailsOpen(false);
                                    handleViewRecipe(selectedRecipe);
                                }}
                            >
                                View Full Recipe
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Container>
    );
}

export default SharedRecipes;