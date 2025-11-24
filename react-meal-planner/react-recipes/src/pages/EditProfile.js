import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Alert, Chip, FormControl, FormLabel } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/jsonServerAPI';

function EditProfile() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        preferences: user?.preferences || []
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const preferenceOptions = [
        { label: 'Appetizers', value: 'appetizers' },
        { label: 'Main Course', value: 'main-course' },
        { label: 'Salads & Sides', value: 'salads-sides' },
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'Breakfast', value: 'breakfast' },
        { label: 'Dessert', value: 'dessert' },
        { label: 'Soups', value: 'soups' },
        { label: 'Drinks', value: 'drinks' },
        { label: 'Quick & Easy', value: 'quick-easy' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handlePreferenceToggle = (value) => {
        setFormData(prev => ({
            ...prev,
            preferences: prev.preferences.includes(value)
                ? prev.preferences.filter(p => p !== value)
                : [...prev.preferences, value]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }

        setLoading(true);

        try {
            await api.patch(`/users/${user.id}`, {
                name: formData.name,
                email: formData.email,
                preferences: formData.preferences
            });

            // Update user in context
            setUser({ ...user, name: formData.name, email: formData.email, preferences: formData.preferences });
            setSuccess('Profile updated successfully!');

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        navigate('/login', { state: { from: '/edit-profile' } });
        return null;
    }

    return (
        <Container maxWidth="sm" sx={{ pt: 12, pb: 6 }}>
            <Paper elevation={2} sx={{ p: 4 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                    Edit Profile
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                        <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
                            Dietary Preferences
                        </FormLabel>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {preferenceOptions.map((pref) => (
                                <Chip
                                    key={pref.value}
                                    label={pref.label}
                                    onClick={() => handlePreferenceToggle(pref.value)}
                                    color={formData.preferences.includes(pref.value) ? "primary" : "default"}
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Box>
                    </FormControl>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate('/')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            startIcon={<SaveIcon />}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default EditProfile;
