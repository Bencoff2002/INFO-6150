import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Alert,
    Snackbar,
    Divider
} from '@mui/material';
import {
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    WhatsApp as WhatsAppIcon,
    Email as EmailIcon,
    ContentCopy as CopyIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function ShareDialog({ open, onClose, preSelectedRecipe = null }) {
    const { user, favorites } = useAuth();
    const [selectedRecipe, setSelectedRecipe] = useState('');
    const [myRecipes, setMyRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [shareLink, setShareLink] = useState('');

    useEffect(() => {
        if (open && user) {
            loadMyRecipes();
            // Set pre-selected recipe if provided
            if (preSelectedRecipe) {
                setSelectedRecipe(preSelectedRecipe);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user, preSelectedRecipe]);

    const loadMyRecipes = async () => {
        try {
            const response = await axios.get('http://localhost:5001/myRecipes', {
                params: { userId: user.id }
            });
            setMyRecipes(response.data || []);
        } catch (err) {
            console.error('Failed to load recipes:', err);
        }
    };

    const handleShareToPublic = async () => {
        if (!selectedRecipe) {
            setSnackbar({ open: true, message: 'Please select a recipe to share', severity: 'warning' });
            return;
        }

        try {
            setLoading(true);

            // Find the recipe details
            let recipe = null;
            if (selectedRecipe.startsWith('fav_')) {
                const favoriteId = selectedRecipe.replace('fav_', '');
                recipe = favorites.find(f => f.id === favoriteId);
            } else {
                recipe = myRecipes.find(r => r.id === selectedRecipe);
            }

            if (!recipe) {
                setSnackbar({ open: true, message: 'Recipe not found', severity: 'error' });
                return;
            }

            // Create shared recipe entry
            const sharedRecipe = {
                userId: user.id,
                userName: user.name || user.email,
                recipeId: recipe.recipeId || recipe.id,
                recipeTitle: recipe.title,
                recipeImage: recipe.image,
                recipeSummary: recipe.summary || 'Delicious recipe shared by ' + (user.name || user.email),
                sharedAt: new Date().toISOString()
            };

            const response = await axios.post('http://localhost:5001/sharedRecipes', sharedRecipe);

            // Generate shareable link
            const link = `${window.location.origin}/shared-recipes#${response.data.id}`;
            setShareLink(link);

            setSnackbar({
                open: true,
                message: 'Recipe shared successfully! Share link generated.',
                severity: 'success'
            });
        } catch (err) {
            console.error('Failed to share recipe:', err);
            setSnackbar({ open: true, message: 'Failed to share recipe', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
    };

    const shareToSocial = (platform) => {
        if (!shareLink) {
            setSnackbar({ open: true, message: 'Please generate a share link first', severity: 'warning' });
            return;
        }

        const recipe = selectedRecipe.startsWith('fav_')
            ? favorites.find(f => f.id === selectedRecipe.replace('fav_', ''))
            : myRecipes.find(r => r.id === selectedRecipe);

        const text = `Check out this amazing recipe: ${recipe?.title || 'Recipe'}`;

        let url = '';
        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareLink)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(shareLink)}`;
                break;
            default:
                return;
        }

        window.open(url, '_blank', 'width=600,height=400');
    };

    const handleClose = () => {
        if (!preSelectedRecipe) {
            setSelectedRecipe('');
        }
        setShareLink('');
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Share Recipe</Typography>
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Share your favorite recipes with the community! Select a recipe and generate a public link.
                        </Typography>

                        <FormControl fullWidth>
                            <InputLabel>Select Recipe</InputLabel>
                            <Select
                                value={selectedRecipe}
                                label="Select Recipe"
                                onChange={(e) => setSelectedRecipe(e.target.value)}
                            >
                                {favorites && favorites.length > 0 && (
                                    <>
                                        <MenuItem disabled>
                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                Favorites
                                            </Typography>
                                        </MenuItem>
                                        {favorites.map((fav) => (
                                            <MenuItem key={`fav_${fav.id}`} value={`fav_${fav.id}`}>
                                                {fav.title}
                                            </MenuItem>
                                        ))}
                                    </>
                                )}

                                {myRecipes && myRecipes.length > 0 && (
                                    <>
                                        <MenuItem disabled>
                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                My Recipe Book
                                            </Typography>
                                        </MenuItem>
                                        {myRecipes.map((recipe) => (
                                            <MenuItem key={recipe.id} value={recipe.id}>
                                                {recipe.title}
                                            </MenuItem>
                                        ))}
                                    </>
                                )}

                                {(!favorites || favorites.length === 0) && (!myRecipes || myRecipes.length === 0) && (
                                    <MenuItem disabled>No recipes available</MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            onClick={handleShareToPublic}
                            disabled={!selectedRecipe || loading}
                            fullWidth
                        >
                            {loading ? 'Generating Link...' : 'Generate Share Link'}
                        </Button>

                        {shareLink && (
                            <>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Share Link
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            value={shareLink}
                                            InputProps={{
                                                readOnly: true,
                                            }}
                                            size="small"
                                        />
                                        <IconButton onClick={copyToClipboard} color="primary">
                                            <CopyIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Share on Social Media
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <IconButton
                                            onClick={() => shareToSocial('facebook')}
                                            sx={{ color: '#1877F2' }}
                                        >
                                            <FacebookIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => shareToSocial('twitter')}
                                            sx={{ color: '#1DA1F2' }}
                                        >
                                            <TwitterIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => shareToSocial('whatsapp')}
                                            sx={{ color: '#25D366' }}
                                        >
                                            <WhatsAppIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => shareToSocial('email')}
                                            sx={{ color: '#EA4335' }}
                                        >
                                            <EmailIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default ShareDialog;
