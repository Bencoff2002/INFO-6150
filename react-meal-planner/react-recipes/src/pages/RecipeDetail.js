import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Container, Button, List, ListItem, ListItemText, Divider, Alert, CircularProgress, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { getRecipeDetails } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';
import api from '../services/jsonServerAPI';
import { createMarkup } from '../utils/htmlUtils';

function RecipeDetail({ isCustomRecipe = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                let data;
                if (isCustomRecipe) {
                    // Fetch from myRecipes API
                    const res = await api.get(`/myRecipes/${id}`);
                    data = res.data;

                    // Transform custom recipe data to match expected format
                    data = {
                        ...data,
                        // Parse string instructions/ingredients back if needed for display
                        instructions: data.instructions || '',
                        ingredients: data.ingredients || ''
                    };
                } else {
                    // Fetch from Spoonacular API
                    data = await getRecipeDetails(id);
                }

                if (mounted) setRecipe(data);
            } catch (err) {
                if (mounted) setError(err.message || 'Failed to load recipe');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false };
    }, [id, isCustomRecipe]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Container sx={{ py: 6 }}>
            <Alert severity="error">{error}</Alert>
        </Container>
    );

    if (!recipe) return null;

    return (
        <Container maxWidth="lg" sx={{ py: 6, pt: 12 }}>
            {/* Back Button */}
            <Box sx={{ mb: 2 }}>
                <IconButton
                    onClick={() => {
                        // Check if we came from meal planner
                        if (location.state?.from === '/meal-planner') {
                            navigate('/meal-planner');
                        } else {
                            navigate(-1);
                        }
                    }}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { backgroundColor: 'action.hover' }
                    }}
                >
                    <ArrowBack />
                </IconButton>
                {location.state?.fromName && (
                    <Typography variant="body2" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                        Back to {location.state.fromName}
                    </Typography>
                )}
            </Box>

            {/* Recipe Header */}
            <Box sx={{ mb: 4 }}>
                <img src={recipe.image} alt={recipe.title} style={{ width: '100%', maxHeight: '400px', borderRadius: 12, objectFit: 'cover' }} />
                <Typography variant="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>{recipe.title}</Typography>
                {recipe.summary && (
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                            mb: 2,
                            '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                            '& b': { fontWeight: 600 }
                        }}
                        dangerouslySetInnerHTML={createMarkup(recipe.summary)}
                    />
                )}
            </Box>

            {user ? (
                <>
                    {/* Three Column Layout: Ingredients | Instructions | Nutrition */}
                    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, mb: 4 }}>
                        {/* Ingredients */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Ingredients</Typography>
                            {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 ? (
                                <List dense>
                                    {recipe.extendedIngredients.map(ing => (
                                        <ListItem key={ing.id} sx={{ pl: 0 }}>
                                            <ListItemText primary={ing.original || `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`} />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : recipe.ingredients ? (
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{recipe.ingredients}</Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No ingredients available.</Typography>
                            )}
                        </Box>

                        {/* Instructions */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Instructions</Typography>
                            {recipe.instructions ? (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        whiteSpace: 'pre-line',
                                        lineHeight: 1.8,
                                        '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                                        '& b': { fontWeight: 600 },
                                        '& ol': { paddingLeft: 2 },
                                        '& li': { marginBottom: 1 }
                                    }}
                                    dangerouslySetInnerHTML={createMarkup(recipe.instructions)}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">No instructions available.</Typography>
                            )}
                        </Box>

                        {/* Nutrition Info */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Nutrition</Typography>
                            {recipe.nutrition ? (
                                <List dense>
                                    {recipe.nutrition.nutrients?.slice(0, 8).map((nutrient, idx) => (
                                        <ListItem key={idx} sx={{ pl: 0, py: 0.5 }}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2">{nutrient.name}</Typography>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {nutrient.amount} {nutrient.unit}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Basic nutrition per serving:
                                    </Typography>
                                    <List dense>
                                        {recipe.servings && (
                                            <ListItem sx={{ pl: 0, py: 0.5 }}>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Typography variant="body2">Servings</Typography>
                                                            <Typography variant="body2" fontWeight={500}>{recipe.servings}</Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        )}
                                        {recipe.readyInMinutes && (
                                            <ListItem sx={{ pl: 0, py: 0.5 }}>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Typography variant="body2">Ready in</Typography>
                                                            <Typography variant="body2" fontWeight={500}>{recipe.readyInMinutes} min</Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        )}
                                        <ListItem sx={{ pl: 0, py: 0.5 }}>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                        Detailed nutrition info not available
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    </List>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </>
            ) : (
                <Box sx={{ mt: 3, mb: 4 }}>
                    <Alert severity="info">Please log in to view full recipe details (ingredients, instructions & nutrition).</Alert>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login', { state: { from: window.location.pathname } })}>Log in</Button>
                </Box>
            )}
        </Container>
    );
}

export default RecipeDetail;
