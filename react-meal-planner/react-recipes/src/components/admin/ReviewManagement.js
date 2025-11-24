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
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    Rating,
    Card,
    CardContent,
    Grid
} from '@mui/material';
import {
    Delete as DeleteIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Search as SearchIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';

function ReviewManagement({ onStatsUpdate }) {
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [alert, setAlert] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, approved, pending

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsRes, usersRes] = await Promise.all([
                fetch('http://localhost:5001/reviews'),
                fetch('http://localhost:5001/users')
            ]);

            const reviewsData = await reviewsRes.json();
            const usersData = await usersRes.json();

            setReviews(reviewsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlert({ type: 'error', message: 'Failed to load reviews' });
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Unknown User';
    };

    const handleDeleteReview = async (review) => {
        try {
            const response = await fetch(`http://localhost:5001/reviews/${review.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setAlert({ type: 'success', message: 'Review deleted successfully' });
                fetchData();
                onStatsUpdate();
            } else {
                throw new Error('Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            setAlert({ type: 'error', message: 'Failed to delete review' });
        }
        setDeleteDialogOpen(false);
        setSelectedReview(null);
    };

    const handleApproveReview = async (review) => {
        try {
            const updatedReview = { ...review, status: 'approved' };
            const response = await fetch(`http://localhost:5001/reviews/${review.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedReview)
            });

            if (response.ok) {
                setAlert({ type: 'success', message: 'Review approved successfully' });
                fetchData();
                onStatsUpdate();
            } else {
                throw new Error('Failed to approve review');
            }
        } catch (error) {
            console.error('Error approving review:', error);
            setAlert({ type: 'error', message: 'Failed to approve review' });
        }
    };

    const handleRejectReview = async (review) => {
        try {
            const updatedReview = { ...review, status: 'rejected' };
            const response = await fetch(`http://localhost:5001/reviews/${review.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedReview)
            });

            if (response.ok) {
                setAlert({ type: 'success', message: 'Review rejected successfully' });
                fetchData();
                onStatsUpdate();
            } else {
                throw new Error('Failed to reject review');
            }
        } catch (error) {
            console.error('Error rejecting review:', error);
            setAlert({ type: 'error', message: 'Failed to reject review' });
        }
    };

    const openDeleteDialog = (review) => {
        setSelectedReview(review);
        setDeleteDialogOpen(true);
    };

    const openViewDialog = (review) => {
        setSelectedReview(review);
        setViewDialogOpen(true);
    };

    const closeDialogs = () => {
        setDeleteDialogOpen(false);
        setViewDialogOpen(false);
        setSelectedReview(null);
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch =
            (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (review.recipeId && review.recipeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            getUserName(review.userId).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'approved' && review.status === 'approved') ||
            (filterStatus === 'pending' && review.status === 'pending') ||
            (filterStatus === 'rejected' && review.status === 'rejected');

        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStats = () => {
        const approved = reviews.filter(r => r.status === 'approved').length;
        const pending = reviews.filter(r => r.status === 'pending').length;
        const rejected = reviews.filter(r => r.status === 'rejected').length;
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        return { approved, pending, rejected, total: reviews.length, avgRating };
    };

    const stats = getStats();

    if (loading) {
        return <Typography>Loading reviews...</Typography>;
    }

    return (
        <Box>
            <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Review Management
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                                {stats.total}
                            </Typography>
                            <Typography color="text.secondary">
                                Total Reviews
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {stats.approved}
                            </Typography>
                            <Typography color="text.secondary">
                                Approved
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                                {stats.pending}
                            </Typography>
                            <Typography color="text.secondary">
                                Pending
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main">
                                {stats.avgRating}
                            </Typography>
                            <Typography color="text.secondary">
                                Avg Rating
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant={filterStatus === 'all' ? 'contained' : 'outlined'}
                        onClick={() => setFilterStatus('all')}
                        size="small"
                    >
                        All Reviews
                    </Button>
                    <Button
                        variant={filterStatus === 'approved' ? 'contained' : 'outlined'}
                        onClick={() => setFilterStatus('approved')}
                        size="small"
                        color="success"
                    >
                        Approved
                    </Button>
                    <Button
                        variant={filterStatus === 'pending' ? 'contained' : 'outlined'}
                        onClick={() => setFilterStatus('pending')}
                        size="small"
                        color="warning"
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filterStatus === 'rejected' ? 'contained' : 'outlined'}
                        onClick={() => setFilterStatus('rejected')}
                        size="small"
                        color="error"
                    >
                        Rejected
                    </Button>
                </Box>

                <TextField
                    placeholder="Search reviews..."
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
                            <TableCell>Recipe</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Rating</TableCell>
                            <TableCell>Comment Preview</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredReviews.map((review) => (
                            <TableRow key={review.id} hover>
                                <TableCell sx={{ fontWeight: 'medium' }}>
                                    {review.recipeTitle}
                                </TableCell>
                                <TableCell>{getUserName(review.userId)}</TableCell>
                                <TableCell>
                                    <Rating value={review.rating} readOnly size="small" />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 200 }}>
                                    <Typography variant="body2" noWrap>
                                        {review.comment.length > 50
                                            ? `${review.comment.substring(0, 50)}...`
                                            : review.comment
                                        }
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={review.status === 'approved' ? 'Approved' : review.status === 'pending' ? 'Pending' : 'Rejected'}
                                        color={review.status === 'approved' ? 'success' : review.status === 'pending' ? 'warning' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{formatDate(review.createdAt)}</TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <Tooltip title="View Full Review">
                                            <IconButton
                                                size="small"
                                                onClick={() => openViewDialog(review)}
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>

                                        {review.status === 'pending' && (
                                            <Tooltip title="Approve Review">
                                                <IconButton
                                                    color="success"
                                                    size="small"
                                                    onClick={() => handleApproveReview(review)}
                                                >
                                                    <ApproveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {(review.status === 'pending' || review.status === 'approved') && (
                                            <Tooltip title="Reject Review">
                                                <IconButton
                                                    color="warning"
                                                    size="small"
                                                    onClick={() => handleRejectReview(review)}
                                                >
                                                    <RejectIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        <Tooltip title="Delete Review">
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={() => openDeleteDialog(review)}
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

            {filteredReviews.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                        {searchTerm || filterStatus !== 'all'
                            ? 'No reviews found matching your criteria.'
                            : 'No reviews found.'
                        }
                    </Typography>
                </Box>
            )}

            {/* View Review Dialog */}
            <Dialog open={viewDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
                <DialogTitle>Review Details</DialogTitle>
                <DialogContent>
                    {selectedReview && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {selectedReview.recipeTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                By: {getUserName(selectedReview.userId)} • {formatDate(selectedReview.createdAt)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Rating value={selectedReview.rating} readOnly />
                                <Chip
                                    label={selectedReview.status === 'approved' ? 'Approved' : selectedReview.status === 'pending' ? 'Pending' : 'Rejected'}
                                    color={selectedReview.status === 'approved' ? 'success' : selectedReview.status === 'pending' ? 'warning' : 'error'}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="body1">
                                {selectedReview.comment}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialogs}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={closeDialogs}>
                <DialogTitle>Confirm Delete Review</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this review?
                    </Typography>
                    {selectedReview && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="subtitle2">
                                {selectedReview.recipeTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                By: {getUserName(selectedReview.userId)}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                "{selectedReview.comment}"
                            </Typography>
                        </Box>
                    )}
                    <Typography color="error" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialogs}>Cancel</Button>
                    <Button
                        onClick={() => handleDeleteReview(selectedReview)}
                        color="error"
                        variant="contained"
                    >
                        Delete Review
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ReviewManagement;