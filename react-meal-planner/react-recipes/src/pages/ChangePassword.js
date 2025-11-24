import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/jsonServerAPI';

function ChangePassword() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (formData.newPassword.length < 5) {
            setError('New password must be at least 5 characters long');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Verify current password
            const response = await api.get(`/users/${user.id}`);
            if (response.data.password !== formData.currentPassword) {
                setError('Current password is incorrect');
                setLoading(false);
                return;
            }

            // Update password
            await api.patch(`/users/${user.id}`, {
                password: formData.newPassword
            });

            setSuccess('Password changed successfully!');
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            setError('Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        navigate('/login', { state: { from: '/change-password' } });
        return null;
    }

    return (
        <Container maxWidth="sm" sx={{ pt: 12, pb: 6 }}>
            <Paper elevation={2} sx={{ p: 4 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                    Change Password
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoComplete="current-password"
                    />

                    <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoComplete="new-password"
                        helperText="At least 5 characters"
                    />

                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoComplete="new-password"
                    />

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
                            disabled={loading}
                        >
                            {loading ? 'Changing...' : 'Change Password'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default ChangePassword;
