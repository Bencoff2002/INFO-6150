import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Rating,
    LinearProgress,
    Divider
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
    People as PeopleIcon,
    Restaurant as RestaurantIcon
} from '@mui/icons-material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function AnalyticsDashboard() {
    const [analytics, setAnalytics] = useState({
        users: [],
        favorites: [],
        mealPlans: [],
        reviews: [],
        ratings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [usersRes, favoritesRes, mealPlansRes, reviewsRes, ratingsRes] = await Promise.all([
                fetch('http://localhost:5001/users'),
                fetch('http://localhost:5001/favorites'),
                fetch('http://localhost:5001/mealPlans'),
                fetch('http://localhost:5001/reviews'),
                fetch('http://localhost:5001/ratings')
            ]);

            const [users, favorites, mealPlans, reviews, ratings] = await Promise.all([
                usersRes.json(),
                favoritesRes.json(),
                mealPlansRes.json(),
                reviewsRes.json(),
                ratingsRes.json()
            ]);

            setAnalytics({ users, favorites, mealPlans, reviews, ratings });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTopRecipes = () => {
        const recipeStats = {};

        // Count favorites
        analytics.favorites.forEach(fav => {
            const key = `${fav.recipeId}-${fav.title}`;
            if (!recipeStats[key]) {
                recipeStats[key] = {
                    recipeId: fav.recipeId,
                    title: fav.title,
                    favorites: 0,
                    reviews: 0,
                    totalRating: 0,
                    avgRating: 0
                };
            }
            recipeStats[key].favorites++;
        });

        // Count ratings (which have both recipeId and recipeTitle)
        analytics.ratings.forEach(rating => {
            const key = `${rating.recipeId}-${rating.recipeTitle}`;
            if (!recipeStats[key]) {
                recipeStats[key] = {
                    recipeId: rating.recipeId,
                    title: rating.recipeTitle,
                    favorites: 0,
                    reviews: 0,
                    totalRating: 0,
                    avgRating: 0
                };
            }
            recipeStats[key].reviews++;
            recipeStats[key].totalRating += rating.stars;
        });

        // Count reviews (for review count, but use ratings for rating values)
        analytics.reviews.forEach(review => {
            // Find corresponding recipe title from ratings or favorites
            let recipeTitle = 'Unknown Recipe';
            const ratingMatch = analytics.ratings.find(r => r.recipeId === review.recipeId);
            const favoriteMatch = analytics.favorites.find(f => f.recipeId == review.recipeId);

            if (ratingMatch) {
                recipeTitle = ratingMatch.recipeTitle;
            } else if (favoriteMatch) {
                recipeTitle = favoriteMatch.title;
            }

            const key = `${review.recipeId}-${recipeTitle}`;
            if (!recipeStats[key]) {
                recipeStats[key] = {
                    recipeId: review.recipeId,
                    title: recipeTitle,
                    favorites: 0,
                    reviews: 0,
                    totalRating: 0,
                    avgRating: 0
                };
            }
            // Just count the review, don't add rating here as we get that from ratings collection
        });

        // Calculate average ratings
        Object.values(recipeStats).forEach(recipe => {
            if (recipe.reviews > 0) {
                recipe.avgRating = recipe.totalRating / recipe.reviews;
            }
        });

        return Object.values(recipeStats)
            .sort((a, b) => (b.favorites + b.reviews) - (a.favorites + a.reviews))
            .slice(0, 8); // Reduced to 8 for better pie chart visibility
    };

    const getBarChartData = () => {
        const topRecipes = calculateTopRecipes();

        // Generate professional colors using the navbar theme
        const colors = [
            '#FF9F29', // Primary orange
            '#FFB347', // Light orange
            '#FF8C00', // Dark orange
            '#FFA500', // Orange
            '#FFD700', // Gold
            '#FF7F50', // Coral
            '#FF6347', // Tomato
            '#FF4500'  // Red orange
        ];

        const backgroundColors = colors.slice(0, topRecipes.length);
        const borderColors = backgroundColors.map(color => color);

        return {
            labels: topRecipes.map(recipe => {
                // Truncate long recipe names for better display
                return recipe.title.length > 20
                    ? recipe.title.substring(0, 17) + '...'
                    : recipe.title;
            }),
            datasets: [
                {
                    label: 'Total Interactions',
                    data: topRecipes.map(recipe => recipe.favorites + recipe.reviews),
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverBackgroundColor: backgroundColors.map(color => color + '80'),
                    hoverBorderColor: '#1B1B1B',
                    hoverBorderWidth: 3
                }
            ]
        };
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // This makes the bar chart horizontal
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 12,
                    usePointStyle: true,
                    font: { size: 11 },
                    color: '#1B1B1B'
                }
            },
            tooltip: {
                backgroundColor: '#1B1B1B',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                borderColor: '#FF9F29',
                borderWidth: 1,
                callbacks: {
                    label: function (context) {
                        const recipes = calculateTopRecipes();
                        const recipe = recipes[context.dataIndex];
                        return `${context.dataset.label}: ${context.parsed.x} (F:${recipe.favorites} R:${recipe.reviews} Avg:${recipe.avgRating > 0 ? recipe.avgRating.toFixed(1) : 'N/A'})`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { color: '#1B1B1B' }
            },
            y: {
                ticks: { color: '#1B1B1B' }
            }
        }
    };

    const calculateUserStats = () => {
        return analytics.users
            .filter(user => !user.isAdmin)
            .map(user => {
                const userFavorites = analytics.favorites.filter(f => f.userId === user.id).length;
                const userMealPlans = analytics.mealPlans.filter(m => m.userId === user.id).length;
                const userReviews = analytics.reviews.filter(r => r.userId === user.id).length;

                return {
                    ...user,
                    favoritesCount: userFavorites,
                    mealPlansCount: userMealPlans,
                    reviewsCount: userReviews,
                    totalActivity: userFavorites + userMealPlans + userReviews
                };
            })
            .sort((a, b) => b.totalActivity - a.totalActivity)
            .slice(0, 10);
    };

    const getOverviewStats = () => {
        const totalUsers = analytics.users.filter(u => !u.isAdmin).length;
        const activeUsers = analytics.users.filter(u => u.active && !u.isAdmin).length;
        const totalReviews = analytics.reviews.length;
        const approvedReviews = analytics.reviews.filter(r => r.isApproved).length;
        const avgRating = analytics.reviews.length > 0
            ? analytics.reviews.reduce((sum, r) => sum + r.rating, 0) / analytics.reviews.length
            : 0;

        return {
            totalUsers,
            activeUsers,
            totalReviews,
            approvedReviews,
            avgRating: avgRating.toFixed(1),
            totalFavorites: analytics.favorites.length,
            totalMealPlans: analytics.mealPlans.length
        };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTimeSpent = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    if (loading) {
        return <Typography>Loading analytics...</Typography>;
    }

    const topUsers = calculateUserStats();
    const stats = getOverviewStats();

    return (
        <Box>
            {/* <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
                Analytics Dashboard
            </Typography> */}

            {/* Most Popular Recipes - Bar Chart - Full Width */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{
                        color: 'secondary.main',
                        fontWeight: 600,
                        mb: 3
                    }}>
                        Most Popular Recipes
                    </Typography>
                    <Box sx={{
                        height: 400,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        {calculateTopRecipes().length > 0 ? (
                            <Bar data={getBarChartData()} options={barChartOptions} />
                        ) : (
                            <Typography color="text.secondary">
                                No recipe data available
                            </Typography>
                        )}
                    </Box>

                    {/* Recipe Statistics Summary */}
                    <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid rgba(27, 27, 27, 0.08)` }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                        {analytics.favorites.length}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Total Favorites
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center', m: 'auto' }}>
                                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                        {analytics.reviews.length}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Total Reviews
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>

            {/* Most Active Users - Full Width */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Most Active Users
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell align="center">Activity</TableCell>
                                    <TableCell align="center">Time Spent</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {topUsers.map((user, index) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {user.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Joined {formatDate(user.createdAt)}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">
                                                {user.favoritesCount}F / {user.mealPlansCount}M / {user.reviewsCount}R
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">
                                                {formatTimeSpent(user.totalTimeSpent)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={user.active ? 'Active' : 'Inactive'}
                                                color={user.active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}

export default AnalyticsDashboard;