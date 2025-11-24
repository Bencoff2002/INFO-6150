import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Alert, CircularProgress, Box } from '@mui/material';

function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !user.isAdmin) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">
                    Access denied. Administrator privileges required.
                </Alert>
            </Container>
        );
    }

    return children;
}

export default ProtectedRoute;