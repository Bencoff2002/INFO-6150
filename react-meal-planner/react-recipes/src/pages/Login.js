import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Paper, Chip, FormControl, FormLabel, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        preferences: []
    });
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutEndTime, setLockoutEndTime] = useState(null);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [showPasswordChangePrompt, setShowPasswordChangePrompt] = useState(false);
    const [wasLockedOut, setWasLockedOut] = useState(false);

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

    // Check lockout status on component mount and set up timer
    useEffect(() => {
        const storedLockoutEnd = localStorage.getItem(`lockoutEnd_${formData.email}`);
        const storedAttempts = localStorage.getItem(`failedAttempts_${formData.email}`);

        if (storedLockoutEnd) {
            const lockoutEnd = parseInt(storedLockoutEnd, 10);
            const now = Date.now();

            if (now < lockoutEnd) {
                setLockoutEndTime(lockoutEnd);
                setIsLocked(true);
                setRemainingTime(Math.ceil((lockoutEnd - now) / 1000));
            } else {
                // Lockout expired, clear it
                localStorage.removeItem(`lockoutEnd_${formData.email}`);
                localStorage.removeItem(`failedAttempts_${formData.email}`);
            }
        }

        if (storedAttempts) {
            setFailedAttempts(parseInt(storedAttempts, 10));
        }
    }, [formData.email]);

    // Timer countdown for lockout
    useEffect(() => {
        if (!isLocked || !lockoutEndTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const timeLeft = Math.ceil((lockoutEndTime - now) / 1000);

            if (timeLeft <= 0) {
                setIsLocked(false);
                setLockoutEndTime(null);
                setFailedAttempts(0);
                setWasLockedOut(true);
                localStorage.removeItem(`lockoutEnd_${formData.email}`);
                localStorage.removeItem(`failedAttempts_${formData.email}`);
                clearInterval(interval);
            } else {
                setRemainingTime(timeLeft);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLocked, lockoutEndTime, formData.email]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Check if account is locked
        if (isLocked) {
            setError(`Account temporarily locked. Please wait ${formatTime(remainingTime)} before trying again.`);
            return;
        }

        setLoading(true);

        try {
            let userData;
            if (isLogin) {
                userData = await login(formData.email, formData.password);

                // Successful login - reset failed attempts
                localStorage.removeItem(`failedAttempts_${formData.email}`);
                localStorage.removeItem(`lockoutEnd_${formData.email}`);

                // If user was locked out, show password change prompt
                if (wasLockedOut) {
                    setShowPasswordChangePrompt(true);
                    setWasLockedOut(false);
                    setLoading(false);
                    return;
                }
            } else {
                userData = await register(formData.email, formData.password, formData.name, formData.preferences);
            }

            // Determine redirect path based on user role
            let redirectTo;
            if (userData && userData.isAdmin) {
                // Admin users go to admin dashboard
                redirectTo = '/admin-dashboard';
            } else {
                // Regular users go to intended location or home
                redirectTo = (location.state && location.state.from) ? location.state.from : '/';
            }

            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message);

            // Only track failed attempts for login (not registration)
            if (isLogin) {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                localStorage.setItem(`failedAttempts_${formData.email}`, newAttempts.toString());

                if (newAttempts >= 3) {
                    // Lock account for 2 minutes (120,000 milliseconds)
                    const lockoutEnd = Date.now() + 120000;
                    setLockoutEndTime(lockoutEnd);
                    setIsLocked(true);
                    setRemainingTime(120);
                    localStorage.setItem(`lockoutEnd_${formData.email}`, lockoutEnd.toString());
                    setError('Too many failed attempts. Account locked for 2 minutes.');
                } else {
                    setError(`${err.message} (Attempt ${newAttempts}/3)`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChangeYes = () => {
        setShowPasswordChangePrompt(false);
        navigate('/change-password');
    };

    const handlePasswordChangeNo = () => {
        setShowPasswordChangePrompt(false);
        // Proceed with normal navigation
        let redirectTo;
        if (location.state && location.state.from) {
            redirectTo = location.state.from;
        } else {
            redirectTo = '/';
        }
        navigate(redirectTo, { replace: true });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePreferenceToggle = (value) => {
        setFormData(prev => ({
            ...prev,
            preferences: prev.preferences.includes(value)
                ? prev.preferences.filter(p => p !== value)
                : [...prev.preferences, value]
        }));
    };

    // Check if user came from another page
    const fromPage = location.state?.from;
    const showBackArrow = fromPage && fromPage !== '/login';

    const handleBackClick = () => {
        if (fromPage) {
            navigate(fromPage);
        } else {
            navigate(-1); // Go back in history
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 'calc(100vh - 64px)', // Subtract navbar height
                p: 2
            }}
        >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', position: 'relative' }}>
                {/* Back Arrow - shown when coming from another page */}
                {showBackArrow && (
                    <IconButton
                        onClick={handleBackClick}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            color: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 159, 41, 0.1)'
                            }
                        }}
                        aria-label="back to previous page"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                )}

                <Typography variant="h5" component="h1" gutterBottom sx={{ pl: showBackArrow ? 5 : 0 }}>
                    {isLogin ? 'Login' : 'Register'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />

                            <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                                <FormLabel sx={{ mb: 1, fontSize: '0.875rem', color: 'text.primary' }}>
                                    Dietary Preferences (Optional)
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
                        </>
                    )}

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3 }}
                        disabled={loading || isLocked}
                    >
                        {isLocked ? `Locked (${formatTime(remainingTime)})` : (isLogin ? 'Login' : 'Register')}
                    </Button>

                    <Button
                        fullWidth
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        sx={{ mt: 1 }}
                        disabled={isLocked}
                    >
                        {isLogin
                            ? "Don't have an account? Register"
                            : 'Already have an account? Login'}
                    </Button>
                </Box>
            </Paper>

            {/* Password Change Prompt Dialog */}
            <Dialog
                open={showPasswordChangePrompt}
                onClose={() => { }}
                aria-labelledby="password-change-dialog-title"
                aria-describedby="password-change-dialog-description"
            >
                <DialogTitle id="password-change-dialog-title">
                    Change Password Recommended
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="password-change-dialog-description">
                        Your account was temporarily locked due to multiple failed login attempts.
                        For security reasons, we recommend changing your password. Would you like to change it now?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handlePasswordChangeNo} color="inherit">
                        No, Thanks
                    </Button>
                    <Button onClick={handlePasswordChangeYes} variant="contained" color="primary" autoFocus>
                        Yes, Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Login;