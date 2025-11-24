import React, { useState, useEffect } from 'react';
import {
    Card, CardMedia, CardContent, Typography, IconButton, Box, Tooltip, Menu, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
    TextField, Rating
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addMyRecipe, getMyRecipes, deleteMyRecipe, getUserRating, upsertRating, addComment } from '../services/jsonServerAPI';
import { stripHtml } from '../utils/htmlUtils';
import axios from 'axios';

function RecipeCard({ recipe, featured, rating, onOpen, onDeleted }) {
    const navigate = useNavigate();
    const { user, favorites, addFavorite, removeFavorite } = useAuth();
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [myRecipeId, setMyRecipeId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [sharePromptOpen, setSharePromptOpen] = useState(false);
    const [justAddedRecipe, setJustAddedRecipe] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [newComment, setNewComment] = useState('');

    // If recipe has isMine property, it's already from My Recipe Book
    const isMyRecipe = recipe.isMine === true;

    // Check if this recipe is already in user's book
    useEffect(() => {
        let mounted = true;
        const checkInBook = async () => {
            if (!user || !recipe.id || isMyRecipe) return;
            try {
                const myRecipes = await getMyRecipes(user.id);
                const existing = myRecipes.find(r => r.sourceRecipeId === recipe.id);
                if (mounted && existing) {
                    setMyRecipeId(existing.id);
                }
            } catch (err) {
                console.warn('Failed to check recipe book:', err);
            }
        };
        checkInBook();
        return () => { mounted = false };
    }, [user, recipe.id, isMyRecipe]);

    // Load user's existing rating
    useEffect(() => {
        let mounted = true;
        const loadUserRating = async () => {
            if (!user || !recipe.id) return;
            try {
                const rating = await getUserRating(recipe.id, user.id);
                if (mounted && rating) {
                    setUserRating(rating.stars);
                }
            } catch (err) {
                console.warn('Failed to load user rating:', err);
            }
        };
        loadUserRating();
        return () => { mounted = false };
    }, [user, recipe.id]);

    const defaultOpen = () => {
        if (user) {
            // If it's a custom recipe (from My Recipe Book), navigate to custom recipe detail
            if (isMyRecipe) {
                navigate(`/my-recipes/${recipe.id}`);
            } else {
                navigate(`/recipe/${recipe.id}`);
            }
        } else {
            navigate('/login', { state: { from: window.location.pathname } });
        }
    };

    const handleClick = () => {
        if (onOpen) return onOpen(recipe);
        return defaultOpen();
    };

    const fav = favorites?.find((f) => f.recipeId === recipe.id);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        if (!user) {
            // optionally navigate to login
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }

        if (fav) {
            await removeFavorite(fav.id);
        } else {
            await addFavorite(recipe);
            // Show share prompt after adding to favorites
            setJustAddedRecipe(recipe);
            setSharePromptOpen(true);
        }
    };

    const handleSharePromptYes = async () => {
        try {
            setShareLoading(true);

            // Create shared recipe entry
            const sharedRecipe = {
                userId: user.id,
                userName: user.name || user.email,
                recipeId: justAddedRecipe.id,
                recipeTitle: justAddedRecipe.title,
                recipeImage: justAddedRecipe.image,
                recipeSummary: justAddedRecipe.summary || 'Delicious recipe shared by ' + (user.name || user.email),
                sharedAt: new Date().toISOString()
            };

            await axios.post('http://localhost:5001/sharedRecipes', sharedRecipe);

            // Show success state
            setShareSuccess(true);

            // Close dialog after a brief moment
            setTimeout(() => {
                setSharePromptOpen(false);
                setJustAddedRecipe(null);
                setShareSuccess(false);
            }, 1500);
        } catch (err) {
            console.error('Failed to share recipe:', err);
            setSharePromptOpen(false);
            setJustAddedRecipe(null);
        } finally {
            setShareLoading(false);
        }
    };

    const handleSharePromptNo = () => {
        setSharePromptOpen(false);
        setJustAddedRecipe(null);
    };

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = (e) => {
        e?.stopPropagation?.();
        setMenuAnchor(null);
    };

    const handleAddToBook = async (e) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        try {
            // Ensure ingredients and instructions are in string format
            let ingredients = recipe.ingredients || '';
            let instructions = recipe.instructions || '';

            // If they're arrays, convert to numbered string format
            if (Array.isArray(recipe.ingredients)) {
                ingredients = recipe.ingredients
                    .filter(Boolean)
                    .map((item, idx) => `${idx + 1}. ${item}`)
                    .join('\n');
            }

            if (Array.isArray(recipe.instructions)) {
                instructions = recipe.instructions
                    .filter(Boolean)
                    .map((item, idx) => `${idx + 1}. ${item}`)
                    .join('\n');
            }

            const payload = {
                userId: user.id,
                sourceRecipeId: recipe.id,
                title: recipe.title,
                image: recipe.image,
                summary: recipe.summary || '',
                servings: recipe.servings || null,
                readyInMinutes: recipe.readyInMinutes || null,
                dishTypes: recipe.dishTypes || [],
                diets: recipe.diets || [],
                ingredients,
                instructions,
            };
            const saved = await addMyRecipe(payload);
            setMyRecipeId(saved.id);
        } catch (err) {
            console.error('Add to book failed:', err);
        } finally {
            handleMenuClose();
        }
    };

    const handleEditInBook = (e) => {
        e.stopPropagation();
        handleMenuClose();
        navigate(`/my-recipes/${myRecipeId}/edit`);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        handleMenuClose();
        navigate(`/my-recipes/${recipe.id}/edit`);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        handleMenuClose();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteMyRecipe(recipe.id);
            setDeleteDialogOpen(false);
            // Call onDeleted callback if provided, otherwise refresh
            if (onDeleted) {
                onDeleted(recipe.id);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete recipe');
            setDeleteDialogOpen(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleRatingClick = (e) => {
        e.stopPropagation();
        handleMenuClose();
        setRatingDialogOpen(true);
    };

    const handleRatingSubmit = async () => {
        try {
            await upsertRating({
                recipeId: recipe.id,
                userId: user.id,
                stars: userRating,
                recipeTitle: recipe.title,
                recipeImage: recipe.image
            });
            setRatingDialogOpen(false);
        } catch (err) {
            console.error('Rating failed:', err);
            alert('Failed to submit rating');
        }
    };

    const handleCommentClick = (e) => {
        e.stopPropagation();
        handleMenuClose();
        setCommentDialogOpen(true);
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        try {
            await addComment({
                recipeId: recipe.id,
                userId: user.id,
                userName: user.name,
                text: newComment.trim()
            });
            setNewComment('');
            setCommentDialogOpen(false);
        } catch (err) {
            console.error('Comment failed:', err);
            alert('Failed to add comment');
        }
    };

    return (
        <Card
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    zIndex: 10
                },
                borderRadius: 1.5,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                position: 'relative',
                bgcolor: 'white'
            }}
        >
            <Tooltip title={user ? '' : 'Please log in to view full recipe details'} arrow disableHoverListener={Boolean(user)}>
                <Box
                    onClick={handleClick}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        cursor: 'pointer'
                    }}
                >
                    <Box sx={{ position: 'relative', paddingTop: '66.67%' }}>
                        <CardMedia
                            component="img"
                            image={recipe.image}
                            alt={recipe.title}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)',
                                zIndex: 1
                            }}
                        />
                        {typeof rating === 'number' && (
                            <Box sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                zIndex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                backgroundColor: 'white',
                                borderRadius: 2,
                                px: 0.75,
                                py: 0.25,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }} onClick={(e) => e.stopPropagation()}>
                                <StarIcon sx={{ fontSize: '1rem', color: 'goldenrod' }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{rating.toFixed(1)}</Typography>
                            </Box>
                        )}
                        <IconButton
                            onClick={handleToggleFavorite}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: typeof rating === 'number' ? 40 : 12,
                                right: 12,
                                backgroundColor: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                zIndex: 2,
                                padding: 0.5,
                                '&:hover': {
                                    backgroundColor: 'white',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <FavoriteIcon
                                sx={{
                                    fontSize: '1rem',
                                    color: fav ? '#FF9F00' : 'action.disabled'
                                }}
                            />
                        </IconButton>
                        {/* Options menu: add to my recipe book - only show if user is logged in */}
                        {user && (
                            <IconButton
                                aria-label={`More options for ${recipe.title}`}
                                onClick={handleMenuOpen}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 12,
                                    backgroundColor: 'secondary.main',
                                    color: 'white',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    zIndex: 2,
                                    padding: 0.5,
                                    '&:hover': {
                                        backgroundColor: 'secondary.dark'
                                    }
                                }}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        )}
                        <Menu
                            anchorEl={menuAnchor}
                            open={Boolean(menuAnchor)}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            slotProps={{
                                paper: {
                                    sx: {
                                        '& .MuiMenuItem-root': {
                                            fontSize: '0.75rem',
                                            py: 0
                                        }
                                    }
                                }
                            }}
                        >
                            {isMyRecipe ? (
                                [
                                    <MenuItem key="edit" onClick={handleEdit}>Edit</MenuItem>,
                                    <MenuItem key="delete" onClick={handleDeleteClick}>Delete</MenuItem>
                                ]
                            ) : (
                                [
                                    // Recipe management options
                                    myRecipeId ? (
                                        <MenuItem key="edit-in-book" onClick={handleEditInBook}>Edit in My Recipe Book</MenuItem>
                                    ) : (
                                        <MenuItem key="add-to-book" onClick={handleAddToBook}>Add to My Recipe Book</MenuItem>
                                    ),
                                    // Rating and comment options for all external recipes
                                    <MenuItem key="rate" onClick={handleRatingClick}>
                                        <RateReviewIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                        Rate Recipe
                                    </MenuItem>,
                                    <MenuItem key="comment" onClick={handleCommentClick}>
                                        <CommentIcon sx={{ mr: 1, fontSize: '1rem' }} />
                                        Add Comment
                                    </MenuItem>
                                ]
                            )}
                        </Menu>

                        {/* Delete Confirmation Dialog */}
                        <Dialog
                            open={deleteDialogOpen}
                            onClose={handleDeleteCancel}
                            aria-labelledby="delete-dialog-title"
                            aria-describedby="delete-dialog-description"
                        >
                            <DialogTitle id="delete-dialog-title">Delete Recipe?</DialogTitle>
                            <DialogContent>
                                <DialogContentText id="delete-dialog-description">
                                    Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleDeleteCancel} color="primary">
                                    Cancel
                                </Button>
                                <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
                                    Delete
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Rating Dialog */}
                        <Dialog
                            open={ratingDialogOpen}
                            onClose={() => setRatingDialogOpen(false)}
                            aria-labelledby="rating-dialog-title"
                            maxWidth="sm"
                            fullWidth
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DialogTitle id="rating-dialog-title">Rate Recipe</DialogTitle>
                            <DialogContent>
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>{recipe.title}</Typography>
                                    <Rating
                                        value={userRating}
                                        onChange={(_, newValue) => setUserRating(newValue || 0)}
                                        size="large"
                                        sx={{ mb: 2 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {userRating > 0 ? `You rated this recipe ${userRating} star${userRating !== 1 ? 's' : ''}` : 'Select a rating'}
                                    </Typography>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleRatingSubmit}
                                    variant="contained"
                                    disabled={userRating === 0}
                                >
                                    Submit Rating
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Comment Dialog */}
                        <Dialog
                            open={commentDialogOpen}
                            onClose={() => setCommentDialogOpen(false)}
                            aria-labelledby="comment-dialog-title"
                            maxWidth="sm"
                            fullWidth
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DialogTitle id="comment-dialog-title">Add Comment</DialogTitle>
                            <DialogContent>
                                <Box sx={{ py: 1 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>{recipe.title}</Typography>
                                    <TextField
                                        autoFocus
                                        label="Your comment"
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Share your thoughts about this recipe..."
                                    />
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleCommentSubmit}
                                    variant="contained"
                                    disabled={!newComment.trim()}
                                >
                                    Add Comment
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                mb: 1,
                                lineHeight: 1.3
                            }}
                        >
                            {recipe.title}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mb: 1.5,
                                lineHeight: 1.5,
                                fontSize: '0.875rem'
                            }}
                        >
                            {stripHtml(recipe.summary)}
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            mt: 'auto'
                        }}>
                            {recipe.readyInMinutes && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        color: 'text.secondary',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    ⏱️ {recipe.readyInMinutes} min
                                </Typography>
                            )}
                            {recipe.servings && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        color: 'text.secondary',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    👥 {recipe.servings} servings
                                </Typography>
                            )}
                        </Box>
                    </CardContent>
                </Box>
            </Tooltip>

            {/* Share Prompt Dialog */}
            <Dialog
                open={sharePromptOpen}
                onClose={shareLoading ? null : handleSharePromptNo}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle>
                    {shareSuccess ? 'Recipe Shared!' : 'Would you share this recipe?'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {shareSuccess
                            ? `"${recipe.title}" has been shared with the community successfully! ✓`
                            : `You've added "${recipe.title}" to your favorites! Would you like to share this recipe with others?`
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {!shareSuccess && (
                        <>
                            <Button onClick={handleSharePromptNo} color="inherit" disabled={shareLoading}>
                                No, Thanks
                            </Button>
                            <Button
                                onClick={handleSharePromptYes}
                                variant="contained"
                                color="primary"
                                disabled={shareLoading}
                            >
                                {shareLoading ? 'Sharing...' : 'Yes, Share'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Card>
    );
}

export default RecipeCard;