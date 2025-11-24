import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    Divider,
    alpha
} from '@mui/material';
import {
    People as PeopleIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/admin/UserManagement';

function AdminUserManagement() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Check if user is admin
    useEffect(() => {
        if (!user || !user.isAdmin) {
            navigate('/');
            return;
        }
    }, [user, navigate]);

    if (!user || !user.isAdmin) {
        return null;
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            pt: 12, // Match home page padding
            pb: 4
        }}>
            <Container maxWidth="lg"> {/* Match home page container width */}
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                bgcolor: 'primary.main',
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2
                            }}
                        >
                            <PeopleIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    color: 'secondary.main',
                                    mb: 0.5,
                                    fontSize: '1.75rem'
                                }}
                            >
                                User Management
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'secondary.light', fontSize: '0.9rem' }}>
                                Manage user accounts, permissions, and activities
                            </Typography>
                        </Box>
                    </Box>
                    <Divider sx={{ bgcolor: alpha('#1B1B1B', 0.08) }} />
                </Box>

                {/* User Management Content */}
                <Paper
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${alpha('#1B1B1B', 0.08)}`,
                        bgcolor: 'background.paper',
                        width: '100%'
                    }}
                >
                    <Box sx={{ p: 3, width: '100%' }}>
                        <UserManagement />
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default AdminUserManagement;