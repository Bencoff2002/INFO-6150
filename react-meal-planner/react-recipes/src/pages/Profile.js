import React, { useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Container, Paper, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const { user, favorites, removeFavorite, editFavorite } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(null);
    const [notes, setNotes] = useState('');

    const preferenceLabels = {
        'appetizers': 'Appetizers',
        'main-course': 'Main Course',
        'salads-sides': 'Salads & Sides',
        'vegetarian': 'Vegetarian',
        'breakfast': 'Breakfast',
        'dessert': 'Dessert',
        'soups': 'Soups',
        'drinks': 'Drinks',
        'quick-easy': 'Quick & Easy'
    };

    const handleEditOpen = (fav) => {
        setEditing(fav);
        setNotes(fav.notes || '');
    };

    const handleEditSave = async () => {
        if (!editing) return;
        await editFavorite(editing.id, { notes });
        setEditing(null);
    };

    const handleRemove = async (favId) => {
        if (window.confirm('Remove this favorite?')) {
            await removeFavorite(favId);
        }
    };

    if (!user) {
        navigate('/login', { state: { from: '/profile' } });
        return null;
    }

    return (
        <Container maxWidth="lg" sx={{ pt: 12, pb: 6 }}>
            <Typography variant="h3" sx={{ mb: 4, fontWeight: 600 }}>Profile</Typography>

            {/* Profile Information Card */}
            <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>Personal Information</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => navigate('/edit-profile')}
                        >
                            Edit Profile
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/change-password')}
                        >
                            Change Password
                        </Button>
                    </Box>
                </Box>

                <Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="h6">{user.name || 'Not set'}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="h6">{user.email}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Dietary Preferences
                        </Typography>
                        {user.preferences && user.preferences.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {user.preferences.map((pref) => (
                                    <Chip
                                        key={pref}
                                        label={preferenceLabels[pref] || pref}
                                        color="primary"
                                        size="small"
                                    />
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No preferences set
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Paper>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Your Favorites</Typography>

            {favorites.length === 0 ? (
                <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        You haven't added any favorites yet. Start exploring recipes!
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {favorites.map((fav) => (
                        <Grid item xs={12} sm={6} md={4} key={fav.id}>
                            <Card>
                                <CardMedia component="img" height="200" image={fav.image} alt={fav.title} />
                                <CardContent>
                                    <Typography variant="h6">{fav.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{fav.notes}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <IconButton onClick={() => handleEditOpen(fav)} aria-label="edit">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleRemove(fav.id)} aria-label="delete">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={!!editing} onClose={() => setEditing(null)}>
                <DialogTitle>Edit Favorite</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Notes"
                        fullWidth
                        multiline
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditing(null)}>Cancel</Button>
                    <Button onClick={handleEditSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Profile;