import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShareIcon from '@mui/icons-material/Share';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';

function Navbar({ onSearch, searchTerm: externalSearchTerm, setSearchTerm: setExternalSearchTerm, loading }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [dashboardMenuEl, setDashboardMenuEl] = useState(null);
    const [userMenuEl, setUserMenuEl] = useState(null);
    const [adminMenuEl, setAdminMenuEl] = useState(null);
    const [adminSubMenuEl, setAdminSubMenuEl] = useState(null);
    const [adminSubMenuType, setAdminSubMenuType] = useState('');
    const dashboardMenuOpen = Boolean(dashboardMenuEl);
    const userMenuOpen = Boolean(userMenuEl);
    const adminMenuOpen = Boolean(adminMenuEl);

    const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
    const setSearchTerm = setExternalSearchTerm || setLocalSearchTerm;

    const handleLogout = () => {
        setUserMenuEl(null);
        logout();
        navigate('/');
    };

    const handleUserMenuClick = (event) => {
        setUserMenuEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuEl(null);
    };

    const handleAdminMenuClick = (event) => {
        setAdminMenuEl(event.currentTarget);
    };

    const handleAdminMenuClose = () => {
        setAdminMenuEl(null);
    };

    const handleAdminSubMenuClose = () => {
        setAdminSubMenuEl(null);
        setAdminSubMenuType('');
    };

    const handleAdminNavigation = (path, userId = null) => {
        handleAdminMenuClose();
        handleAdminSubMenuClose();

        if (userId) {
            const separator = path.includes('?') ? '&' : '?';
            navigate(`${path}${separator}userId=${userId}&admin=true`);
        } else {
            const separator = path.includes('?') ? '&' : '?';
            navigate(`${path}${separator}admin=true`);
        }
    };

    // Admin users data for dropdown
    const [adminUsers, setAdminUsers] = useState([]);

    React.useEffect(() => {
        // Fetch users for admin dropdown
        if (user?.isAdmin) {
            fetch('http://localhost:5001/users')
                .then(res => res.json())
                .then(users => {
                    const nonAdminUsers = users.filter(u => !u.isAdmin);
                    setAdminUsers(nonAdminUsers);
                })
                .catch(err => console.error('Failed to fetch users:', err));
        }
    }, [user]);

    return (
        <AppBar position="fixed" sx={{
            backgroundColor: 'background.default',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
            height: 56 // Reduced height
        }}>
            <Container maxWidth="lg">
                <Toolbar sx={{ minHeight: 56, py: 0 }}> {/* Reduced padding and height */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RestaurantMenuIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                        <Typography
                            variant="h5"
                            component={RouterLink}
                            to="/"
                            sx={{
                                color: 'secondary.main',
                                textDecoration: 'none',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                    color: 'primary.main'
                                }
                            }}
                        >
                            CEECOFF
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
                        <Button
                            component={RouterLink}
                            to="/"
                            sx={{
                                color: 'secondary.main',
                                '&:hover': { color: 'primary.main' },
                                fontSize: '0.875rem',
                                py: 0.5
                            }}
                        >
                            Recipes
                        </Button>
                        {user && !user.isAdmin && (
                            <>
                                <Button
                                    aria-controls={dashboardMenuOpen ? 'dashboard-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={dashboardMenuOpen ? 'true' : undefined}
                                    onMouseEnter={(e) => setDashboardMenuEl(e.currentTarget)}
                                    onClick={(e) => setDashboardMenuEl(e.currentTarget)}
                                    sx={{
                                        color: 'secondary.main',
                                        '&:hover': { color: 'primary.main' },
                                        fontSize: '0.875rem',
                                        py: 0.5
                                    }}
                                >
                                    Dashboard
                                </Button>
                                <Menu
                                    id="dashboard-menu"
                                    anchorEl={dashboardMenuEl}
                                    open={dashboardMenuOpen}
                                    onClose={() => setDashboardMenuEl(null)}
                                    MenuListProps={{ onMouseLeave: () => setDashboardMenuEl(null) }}
                                >
                                    <MenuItem
                                        onClick={() => {
                                            setDashboardMenuEl(null);
                                            navigate('/dashboard?view=top-rated');
                                        }}
                                    >
                                        Top Rated
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            setDashboardMenuEl(null);
                                            navigate('/dashboard?view=favorites');
                                        }}
                                    >
                                        Favourites
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            setDashboardMenuEl(null);
                                            if (user.isAdmin) {
                                                navigate('/meal-planner?admin=true');
                                            } else {
                                                navigate('/meal-planner');
                                            }
                                        }}
                                    >
                                        Meal Planner
                                    </MenuItem>
                                </Menu>
                                <Button
                                    component={RouterLink}
                                    to="/my-recipes"
                                    sx={{
                                        color: 'secondary.main',
                                        '&:hover': { color: 'primary.main' },
                                        fontSize: '0.875rem',
                                        py: 0.5
                                    }}
                                >
                                    My Recipe Book
                                </Button>
                            </>
                        )}
                        <SearchBar
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            handleSearch={onSearch}
                            loading={loading}
                            compact={true}
                        />

                        {/* Shared Recipes Icon - Visible to everyone */}
                        <Tooltip title="Shared Recipes">
                            <IconButton
                                onClick={() => navigate('/shared-recipes')}
                                sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: alpha('#FF9F29', 0.1)
                                    }
                                }}
                            >
                                <ShareIcon />
                            </IconButton>
                        </Tooltip>

                        {user ? (
                            <>
                                {/* Admin Dropdown Menu - Sophisticated admin controls */}
                                {user.isAdmin && (
                                    <>
                                        <Button
                                            variant="outlined"
                                            endIcon={<ExpandMoreIcon />}
                                            startIcon={<AdminPanelSettingsIcon />}
                                            onClick={handleAdminMenuClick}
                                            onMouseEnter={handleAdminMenuClick}
                                            sx={{
                                                color: 'primary.main',
                                                borderColor: 'primary.main',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                py: 0.5,
                                                px: 2,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    borderColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            Admin
                                        </Button>

                                        {/* Main Admin Menu */}
                                        <Menu
                                            anchorEl={adminMenuEl}
                                            open={adminMenuOpen}
                                            onClose={handleAdminMenuClose}
                                            MenuListProps={{
                                                onMouseLeave: handleAdminMenuClose
                                            }}
                                            PaperProps={{
                                                sx: {
                                                    mt: 1,
                                                    minWidth: 250,
                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                                    border: `1px solid ${alpha('#FF9F29', 0.2)}`
                                                }
                                            }}
                                        >
                                            <Box sx={{ px: 2, py: 1.5, bgcolor: alpha('#FF9F29', 0.05) }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                    Admin Panel
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Manage users and content
                                                </Typography>
                                            </Box>
                                            <Divider />

                                            <MenuItem onClick={() => handleAdminNavigation('/admin-dashboard')}>
                                                <ListItemIcon>
                                                    <DashboardIcon sx={{ color: 'primary.main' }} />
                                                </ListItemIcon>
                                                <ListItemText primary="Dashboard" secondary="Analytics & Overview" />
                                            </MenuItem>

                                            <MenuItem
                                                onClick={() => handleAdminNavigation('/dashboard?view=top-rated')}
                                                sx={{
                                                    '&:hover': { bgcolor: alpha('#FF9F29', 0.04) },
                                                    bgcolor: 'transparent'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <StarIcon sx={{ color: 'warning.main' }} />
                                                </ListItemIcon>
                                                <ListItemText primary="Top Rated Recipes" secondary="View & manage user ratings" />
                                            </MenuItem>

                                            <MenuItem
                                                onClick={() => handleAdminNavigation('/dashboard?view=favorites')}
                                                sx={{
                                                    '&:hover': { bgcolor: alpha('#FF9F29', 0.04) },
                                                    bgcolor: 'transparent'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <FavoriteIcon sx={{ color: 'error.main' }} />
                                                </ListItemIcon>
                                                <ListItemText primary="Favorite Recipes" secondary="Manage user favorites" />
                                            </MenuItem>
                                            {/* Reviews - standalone admin page */}
                                            <MenuItem onClick={() => handleAdminNavigation('/admin-reviews')}
                                                sx={{
                                                    '&:hover': { bgcolor: alpha('#FF9F29', 0.04) },
                                                    bgcolor: 'transparent'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <RateReviewIcon sx={{ color: 'secondary.main' }} />
                                                </ListItemIcon>
                                                <ListItemText primary="Reviews" secondary="Manage user reviews" />
                                            </MenuItem>

                                            <Divider />
                                            <MenuItem onClick={() => handleAdminNavigation('/admin-users')}>
                                                <ListItemIcon>
                                                    <PeopleIcon sx={{ color: 'secondary.main' }} />
                                                </ListItemIcon>
                                                <ListItemText primary="User Management" secondary="Add, edit, remove users" />
                                            </MenuItem>
                                        </Menu>

                                        {/* Admin Submenu for User Selection */}
                                        <Menu
                                            anchorEl={adminSubMenuEl}
                                            open={Boolean(adminSubMenuEl)}
                                            onClose={handleAdminSubMenuClose}
                                            anchorOrigin={{
                                                vertical: 'top',
                                                horizontal: 'right',
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'left',
                                            }}
                                            PaperProps={{
                                                sx: {
                                                    bgcolor: 'white',
                                                    boxShadow: '0 8px 32px rgba(255, 159, 41, 0.15)',
                                                    border: '1px solid',
                                                    borderColor: alpha('#FF9F29', 0.2),
                                                    borderRadius: 2,
                                                    mt: 0,
                                                    ml: 1,
                                                    maxWidth: 280,
                                                    '& .MuiMenuItem-root': {
                                                        px: 2,
                                                        py: 1.5,
                                                        minHeight: 'auto',
                                                    },
                                                }
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    px: 2,
                                                    py: 1,
                                                    color: 'text.secondary',
                                                    borderBottom: '1px solid',
                                                    borderColor: alpha('#FF9F29', 0.1),
                                                    mb: 1,
                                                    fontWeight: 600
                                                }}
                                            >
                                                Select User
                                            </Typography>

                                            <MenuItem
                                                onClick={() => {
                                                    if (adminSubMenuType === 'toprated') {
                                                        handleAdminNavigation('/dashboard?view=top-rated&admin=true');
                                                    } else if (adminSubMenuType === 'favorites') {
                                                        handleAdminNavigation('/dashboard?view=favorites&admin=true');
                                                    } else if (adminSubMenuType === 'mealplanner') {
                                                        handleAdminNavigation('/meal-planner?admin=true');
                                                    } else if (adminSubMenuType === 'myrecipes') {
                                                        handleAdminNavigation('/my-recipes?admin=true');
                                                    }
                                                }}
                                                sx={{
                                                    '&:hover': { bgcolor: alpha('#FF9F29', 0.04) },
                                                    fontWeight: 600,
                                                    color: 'primary.main'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <PeopleIcon sx={{ color: 'primary.main' }} />
                                                </ListItemIcon>
                                                <ListItemText primary="All Users" />
                                            </MenuItem>

                                            {adminUsers.map((userData) => (
                                                <MenuItem
                                                    key={userData.id}
                                                    onClick={() => {
                                                        if (adminSubMenuType === 'toprated') {
                                                            handleAdminNavigation('/dashboard?view=top-rated', userData.id);
                                                        } else if (adminSubMenuType === 'favorites') {
                                                            handleAdminNavigation('/dashboard?view=favorites', userData.id);
                                                        } else if (adminSubMenuType === 'mealplanner') {
                                                            handleAdminNavigation('/meal-planner', userData.id);
                                                        } else if (adminSubMenuType === 'myrecipes') {
                                                            handleAdminNavigation('/my-recipes', userData.id);
                                                        }
                                                    }}
                                                    sx={{ '&:hover': { bgcolor: alpha('#FF9F29', 0.04) } }}
                                                >
                                                    <ListItemIcon>
                                                        <Avatar sx={{
                                                            width: 24,
                                                            height: 24,
                                                            fontSize: '0.75rem',
                                                            bgcolor: 'primary.main'
                                                        }}>
                                                            {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                                                        </Avatar>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={userData.name}
                                                        secondary={userData.email}
                                                        sx={{
                                                            '& .MuiListItemText-secondary': {
                                                                fontSize: '0.75rem',
                                                                color: 'text.secondary'
                                                            }
                                                        }}
                                                    />
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </>
                                )}
                                <Box
                                    onClick={handleUserMenuClick}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        px: 1.5,
                                        py: 0.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                                        {user.name || 'User'}
                                    </Typography>
                                </Box>
                                <Menu
                                    anchorEl={userMenuEl}
                                    open={userMenuOpen}
                                    onClose={handleUserMenuClose}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                    PaperProps={{
                                        sx: { mt: 1, minWidth: 200 }
                                    }}
                                >
                                    <Box sx={{ px: 2, py: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {user.name || 'User'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {user.email}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <MenuItem onClick={() => { handleUserMenuClose(); navigate('/edit-profile'); }}>
                                        <EditIcon sx={{ mr: 1 }} />
                                        Edit Profile
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleUserMenuClose(); navigate('/change-password'); }}>
                                        <LockIcon sx={{ mr: 1 }} />
                                        Change Password
                                    </MenuItem>
                                    <Divider />
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon>
                                            <LogoutIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText>Logout</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                component={RouterLink}
                                to="/login"
                                sx={{
                                    fontSize: '0.875rem',
                                    py: 0.2
                                }}
                            >
                                Login
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default Navbar;