import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useAuth } from '../context/AuthContext';
import { addMyRecipe, updateMyRecipe, deleteMyRecipe } from '../services/jsonServerAPI';
import api from '../services/jsonServerAPI';

export default function RecipeEditor({ mode = 'create' }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = mode === 'edit';
    const [loading, setLoading] = useState(isEdit);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: '',
        summary: '',
        image: '',
        readyInMinutes: '',
        servings: '',
        ingredients: [''],
        instructions: ['']
    });

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!isEdit || !id) return;
            setLoading(true);
            try {
                const res = await api.get(`/myRecipes/${id}`);
                if (mounted && res?.data) {
                    const r = res.data;

                    // Ensure ingredients is an array
                    let ingredients = [''];
                    if (Array.isArray(r.ingredients) && r.ingredients.length > 0) {
                        ingredients = r.ingredients;
                    } else if (typeof r.ingredients === 'string' && r.ingredients.trim()) {
                        // Parse string format: "1. Step one\n2. Step two"
                        ingredients = r.ingredients
                            .split('\n')
                            .map(line => line.replace(/^\d+\.\s*/, '').trim())
                            .filter(Boolean);
                        if (ingredients.length === 0) ingredients = [''];
                    }

                    // Ensure instructions is an array
                    let instructions = [''];
                    if (Array.isArray(r.instructions) && r.instructions.length > 0) {
                        instructions = r.instructions;
                    } else if (typeof r.instructions === 'string' && r.instructions.trim()) {
                        // Parse string format: "1. Step one\n2. Step two"
                        instructions = r.instructions
                            .split('\n')
                            .map(line => line.replace(/^\d+\.\s*/, '').trim())
                            .filter(Boolean);
                        if (instructions.length === 0) instructions = [''];
                    }

                    setForm({
                        title: r.title || '',
                        summary: r.summary || '',
                        image: r.image || '',
                        readyInMinutes: r.readyInMinutes || '',
                        servings: r.servings || '',
                        ingredients,
                        instructions
                    });
                }
            } catch (e) {
                setError(e.message || 'Failed to load recipe');
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false };
    }, [id, isEdit]);

    const handleChange = (field) => (e) => {
        setForm((s) => ({ ...s, [field]: e.target.value }));
    };

    const handleArrayChange = (field, index) => (e) => {
        const arr = [...form[field]];
        arr[index] = e.target.value;
        setForm((s) => ({ ...s, [field]: arr }));
    };

    const handleAddRow = (field) => () => {
        setForm((s) => ({ ...s, [field]: [...s[field], ''] }));
    };

    const handleRemoveRow = (field, index) => () => {
        setForm((s) => ({ ...s, [field]: s[field].filter((_, i) => i !== index) }));
    };

    const handleSave = async () => {
        if (!user) { navigate('/login', { state: { from: window.location.pathname } }); return; }
        setSaving(true);
        setError(null);
        try {
            // Convert ingredients and instructions arrays to numbered string format
            const ingredientsFiltered = form.ingredients.filter(Boolean);
            const instructionsFiltered = form.instructions.filter(Boolean);

            const ingredientsString = ingredientsFiltered
                .map((item, idx) => `${idx + 1}. ${item}`)
                .join('\n');

            const instructionsString = instructionsFiltered
                .map((item, idx) => `${idx + 1}. ${item}`)
                .join('\n');

            const payload = {
                userId: user.id,
                title: form.title.trim(),
                summary: form.summary,
                image: form.image,
                readyInMinutes: form.readyInMinutes ? Number(form.readyInMinutes) : null,
                servings: form.servings ? Number(form.servings) : null,
                ingredients: ingredientsString,
                instructions: instructionsString
            };
            if (!payload.title) {
                setError('Title is required');
                setSaving(false);
                return;
            }
            if (isEdit) {
                await updateMyRecipe(id, payload);
            } else {
                await addMyRecipe(payload);
            }
            navigate('/my-recipes');
        } catch (e) {
            setError(e.message || 'Failed to save recipe');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isEdit) return;
        try {
            await deleteMyRecipe(id);
            navigate('/my-recipes');
        } catch (e) {
            setError(e.message || 'Failed to delete recipe');
        }
    };

    return (
        <Container maxWidth="md" sx={{ pt: 12, pb: 6 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <IconButton onClick={() => navigate(-1)} aria-label="Go back" sx={{ color: 'text.secondary' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>
                    {isEdit ? 'Edit Recipe' : 'Create New Recipe'}
                </Typography>
                {isEdit && (
                    <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                        aria-label="Delete recipe"
                    >
                        Delete
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {!loading && (
                <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    {/* Basic Information */}
                    <Card elevation={1} sx={{ mb: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                                Basic Information
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Recipe Title */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Recipe Title *
                                    </Typography>
                                    <TextField
                                        value={form.title}
                                        onChange={handleChange('title')}
                                        fullWidth
                                        required
                                        placeholder="e.g., Grandma's Chocolate Chip Cookies"
                                        inputProps={{ 'aria-label': 'Recipe Title' }}
                                    />
                                </Box>

                                {/* Description */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Description
                                    </Typography>
                                    <TextField
                                        value={form.summary}
                                        onChange={handleChange('summary')}
                                        fullWidth
                                        multiline
                                        rows={4}
                                        placeholder="Tell us about this recipe..."
                                        inputProps={{ 'aria-label': 'Description' }}
                                    />
                                </Box>

                                {/* Image URL */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Image URL
                                    </Typography>
                                    <TextField
                                        value={form.image}
                                        onChange={handleChange('image')}
                                        fullWidth
                                        placeholder="https://example.com/image.jpg"
                                        inputProps={{ 'aria-label': 'Image URL' }}
                                    />
                                </Box>

                                {/* Cooking Time */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Cooking Time (minutes)
                                    </Typography>
                                    <TextField
                                        value={form.readyInMinutes}
                                        onChange={handleChange('readyInMinutes')}
                                        type="number"
                                        fullWidth
                                        placeholder="e.g., 30"
                                        inputProps={{ min: 0, 'aria-label': 'Cooking Time' }}
                                    />
                                </Box>

                                {/* Servings */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Servings
                                    </Typography>
                                    <TextField
                                        value={form.servings}
                                        onChange={handleChange('servings')}
                                        type="number"
                                        fullWidth
                                        placeholder="e.g., 4"
                                        inputProps={{ min: 1, 'aria-label': 'Servings' }}
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Ingredients */}
                    <Card elevation={1} sx={{ mb: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    Ingredients
                                </Typography>
                                <Button
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={handleAddRow('ingredients')}
                                    aria-label="Add ingredient"
                                    variant="outlined"
                                    size="small"
                                >
                                    Add Ingredient
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {form.ingredients.map((ing, idx) => (
                                    <Box key={idx}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Ingredient {idx + 1}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField
                                                placeholder="e.g., 2 cups all-purpose flour"
                                                value={ing}
                                                onChange={handleArrayChange('ingredients', idx)}
                                                fullWidth
                                                inputProps={{ 'aria-label': `Ingredient ${idx + 1}` }}
                                            />
                                            <IconButton
                                                onClick={handleRemoveRow('ingredients', idx)}
                                                aria-label={`Remove ingredient ${idx + 1}`}
                                                color="error"
                                                disabled={form.ingredients.length === 1}
                                            >
                                                <RemoveCircleOutlineIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Instructions */}
                    <Card elevation={1} sx={{ mb: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    Instructions
                                </Typography>
                                <Button
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={handleAddRow('instructions')}
                                    aria-label="Add step"
                                    variant="outlined"
                                    size="small"
                                >
                                    Add Step
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {form.instructions.map((step, idx) => (
                                    <Box key={idx}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Step {idx + 1}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                            <TextField
                                                placeholder="e.g., Preheat oven to 350°F (175°C)"
                                                value={step}
                                                onChange={handleArrayChange('instructions', idx)}
                                                fullWidth
                                                multiline
                                                rows={1}
                                                inputProps={{ 'aria-label': `Step ${idx + 1}` }}
                                            />
                                            <IconButton
                                                onClick={handleRemoveRow('instructions', idx)}
                                                aria-label={`Remove step ${idx + 1}`}
                                                color="error"
                                                disabled={form.instructions.length === 1}
                                                sx={{ mt: 0.5 }}
                                            >
                                                <RemoveCircleOutlineIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        aria-label="Save recipe"
                        sx={{ py: 1.5 }}
                    >
                        {saving ? 'Saving...' : 'Save Recipe'}
                    </Button>
                </Box>
            )}
        </Container>
    );
}
