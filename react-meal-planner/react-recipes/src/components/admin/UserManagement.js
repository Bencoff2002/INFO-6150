import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Switch,
    FormControlLabel,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    Search as SearchIcon
} from '@mui/icons-material';

function UserManagement({ onStatsUpdate }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [alert, setAlert] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit functionality states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editIsAdmin, setEditIsAdmin] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/users');
            const userData = await response.json();
            setUsers(userData);
        } catch (error) {
            console.error('Error fetching users:', error);
            setAlert({ type: 'error', message: 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (user) => {
        try {
            // Delete all user-related data from other tables
            // First fetch all items for this user, then delete them individually
            const [favorites, mealPlans, reviews, ratings, comments, weeklyNotes, myRecipes] = await Promise.all([
                fetch(`http://localhost:5001/favorites?userId=${encodeURIComponent(user.id)}`).then(r => r.json()),
                fetch(`http://localhost:5001/mealPlans?userId=${encodeURIComponent(user.id)}`).then(r => r.json()),
                fetch(`http://localhost:5001/reviews?userId=${encodeURIComponent(user.id)}`).then(r => r.json()),
                fetch(`http://localhost:5001/ratings?userId=${encodeURIComponent(user.id)}`).then(r => r.json()),
                fetch(`http://localhost:5001/comments?userId=${encodeURIComponent(user.id)}`).then(r => r.json()),
                fetch(`http://localhost:5001/weeklyNotes?userId=${encodeURIComponent(user.id)}`).then(r => r.json()),
                fetch(`http://localhost:5001/myRecipes?userId=${encodeURIComponent(user.id)}`).then(r => r.json())
            ]);

            // Delete each item individually
            await Promise.all([
                ...favorites.map(item => fetch(`http://localhost:5001/favorites/${item.id}`, { method: 'DELETE' })),
                ...mealPlans.map(item => fetch(`http://localhost:5001/mealPlans/${item.id}`, { method: 'DELETE' })),
                ...reviews.map(item => fetch(`http://localhost:5001/reviews/${item.id}`, { method: 'DELETE' })),
                ...ratings.map(item => fetch(`http://localhost:5001/ratings/${item.id}`, { method: 'DELETE' })),
                ...comments.map(item => fetch(`http://localhost:5001/comments/${item.id}`, { method: 'DELETE' })),
                ...weeklyNotes.map(item => fetch(`http://localhost:5001/weeklyNotes/${item.id}`, { method: 'DELETE' })),
                ...myRecipes.map(item => fetch(`http://localhost:5001/myRecipes/${item.id}`, { method: 'DELETE' }))
            ]);

            // Delete the user
            const response = await fetch(`http://localhost:5001/users/${user.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setAlert({ type: 'success', message: `User ${user.name} and all associated data deleted successfully` });
                fetchUsers();
                onStatsUpdate();
            } else {
                throw new Error('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setAlert({ type: 'error', message: 'Failed to delete user' });
        }
        setDeleteDialogOpen(false);
        setSelectedUser(null);
    };

    const handleToggleAdmin = async (user) => {
        try {
            const updatedUser = { ...user, isAdmin: !user.isAdmin };
            const response = await fetch(`http://localhost:5001/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedUser)
            });

            if (response.ok) {
                setAlert({
                    type: 'success',
                    message: `${user.name} ${updatedUser.isAdmin ? 'granted' : 'revoked'} admin privileges`
                });
                fetchUsers();
            } else {
                throw new Error('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setAlert({ type: 'error', message: 'Failed to update user privileges' });
        }
    };

    const openDeleteDialog = (user) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
    };

    // Edit functionality
    const openEditDialog = (user) => {
        setEditUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditIsAdmin(user.isAdmin || false);
        setEditDialogOpen(true);
    };

    const closeEditDialog = () => {
        setEditDialogOpen(false);
        setEditUser(null);
        setEditName('');
        setEditEmail('');
        setEditIsAdmin(false);
    };

    const handleEditUser = async () => {
        if (!editUser) return;

        setIsEditing(true);

        try {
            const updatedUser = {
                ...editUser,
                name: editName,
                email: editEmail,
                isAdmin: editIsAdmin
            };

            const response = await fetch(`http://localhost:5001/users/${editUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser)
            });

            if (response.ok) {
                setAlert({
                    type: 'success',
                    message: `User ${editName} updated successfully`
                });
                fetchUsers();
                closeEditDialog();
            } else {
                throw new Error('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setAlert({ type: 'error', message: 'Failed to update user' });
        } finally {
            setIsEditing(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <Typography>Loading users...</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    User Management
                </Typography>
                <TextField
                    placeholder="Search users..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />
            </Box>

            {alert && (
                <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell>Total Time (min)</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {user.isAdmin ? <AdminIcon sx={{ mr: 1, color: 'primary.main' }} /> : <PersonIcon sx={{ mr: 1, color: 'grey.500' }} />}
                                        {user.name}
                                    </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.isAdmin ? 'Admin' : 'User'}
                                        color={user.isAdmin ? 'primary' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.active ? 'Active' : 'Inactive'}
                                        color={user.active ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{formatDate(user.createdAt)}</TableCell>
                                <TableCell>{Math.floor(user.totalTimeSpent / 60)}</TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={user.isAdmin}
                                                    onChange={() => handleToggleAdmin(user)}
                                                    size="small"
                                                />
                                            }
                                            label="Admin"
                                            labelPlacement="start"
                                            sx={{ mr: 1 }}
                                        />
                                        <Tooltip title="Edit User">
                                            <IconButton
                                                color="primary"
                                                size="small"
                                                onClick={() => openEditDialog(user)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete User">
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={() => openDeleteDialog(user)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {filteredUsers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                        {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </Typography>
                </Box>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
                <DialogTitle>Confirm Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
                    </Typography>
                    <Typography color="error" sx={{ mt: 2 }}>
                        This will permanently delete:
                    </Typography>
                    <ul>
                        <li>User account</li>
                        <li>All favorite recipes</li>
                        <li>All meal plans</li>
                        <li>All reviews and ratings</li>
                        <li>All custom recipes</li>
                        <li>All associated data</li>
                    </ul>
                    <Typography color="error" fontWeight="bold">
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteDialog}>Cancel</Button>
                    <Button
                        onClick={() => handleDeleteUser(selectedUser)}
                        color="error"
                        variant="contained"
                    >
                        Delete User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditIcon color="primary" />
                        Edit User
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <TextField
                            label="Name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            fullWidth
                            variant="outlined"
                            required
                        />

                        <TextField
                            label="Email"
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            fullWidth
                            variant="outlined"
                            required
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editIsAdmin}
                                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                                />
                            }
                            label="Administrator privileges"
                            sx={{ mt: 1 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeEditDialog} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditUser}
                        variant="contained"
                        color="primary"
                        disabled={isEditing || !editName.trim() || !editEmail.trim()}
                        startIcon={isEditing ? undefined : <EditIcon />}
                    >
                        {isEditing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UserManagement;