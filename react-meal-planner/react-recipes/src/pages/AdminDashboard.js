import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getAllRatings, getAllFavorites, getAllUsers, getAllMealPlans } from '../services/jsonServerAPI';

function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalFavorites: 0,
    totalMealPlans: 0,
    totalRatings: 0,
    mostReviewedRecipes: [],
    highestRatedRecipes: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data from the database
        const [allUsers, allFavorites, allRatings, allMealPlans] = await Promise.all([
          getAllUsers(),
          getAllFavorites(),
          getAllRatings(),
          getAllMealPlans()
        ]);

        console.log('Admin Dashboard Data (Raw from Server):', {
          users: allUsers.length,
          favorites: allFavorites.length,
          ratings: allRatings.length,
          mealPlans: allMealPlans.length
        });

        // Log actual meal plans data
        console.log('Sample Meal Plans:', allMealPlans.slice(0, 5));

        // Calculate total registered users (excluding admins)
        const totalUsers = allUsers.filter(u => !u.isAdmin).length;

        // Calculate total favorites across all users
        const totalFavorites = allFavorites.length;

        // Calculate total meal plans - count unique users who have saved meal plans
        const uniqueUsersWithMealPlans = new Set(allMealPlans.map(mp => mp.userId));
        const totalMealPlans = uniqueUsersWithMealPlans.size;

        console.log('MEAL PLANS COUNT (Unique users with meal plans):', totalMealPlans);
        console.log('Total meal slots in database:', allMealPlans.length);

        // Calculate total ratings
        const totalRatings = allRatings.length;

        // Process recipes for most reviewed and highest rated
        const recipeStats = new Map();

        allRatings.forEach(rating => {
          const recipeId = String(rating.recipeId);
          if (!recipeStats.has(recipeId)) {
            recipeStats.set(recipeId, {
              id: recipeId,
              name: rating.recipeTitle || 'Unknown Recipe',
              image: rating.recipeImage || '',
              totalStars: 0,
              reviewCount: 0,
              ratings: []
            });
          }

          const stats = recipeStats.get(recipeId);
          stats.totalStars += rating.stars;
          stats.reviewCount += 1;
          stats.ratings.push(rating.stars);
        });

        // Calculate average ratings
        const recipesWithStats = Array.from(recipeStats.values()).map(stats => ({
          id: stats.id,
          name: stats.name,
          image: stats.image,
          reviewCount: stats.reviewCount,
          averageRating: stats.reviewCount > 0 ? (stats.totalStars / stats.reviewCount) : 0
        }));

        // Most reviewed recipes (sorted by number of reviews)
        const mostReviewedRecipes = [...recipesWithStats]
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice(0, 10);

        // Highest rated recipes (sorted by average rating, then by review count)
        const highestRatedRecipes = [...recipesWithStats]
          .filter(recipe => recipe.reviewCount >= 1) // At least 1 review
          .sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
              return b.averageRating - a.averageRating;
            }
            return b.reviewCount - a.reviewCount;
          })
          .slice(0, 10);

        console.log('Calculated Analytics:', {
          totalUsers,
          totalFavorites,
          totalMealPlans,
          totalRatings,
          mostReviewedCount: mostReviewedRecipes.length,
          highestRatedCount: highestRatedRecipes.length
        });

        setAnalytics({
          totalUsers,
          totalFavorites,
          totalMealPlans,
          totalRatings,
          mostReviewedRecipes,
          highestRatedRecipes
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(`Failed to load analytics data: ${err.message}. Please make sure the JSON server is running on port 5001.`);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mx: "auto" }}>
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of key metrics and insights
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Key Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Registered Users */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 1.5,
                    borderRadius: 2,
                    mr: 2
                  }}>
                    <PeopleIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Registered Users
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {analytics.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Total users in system
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Favorite Recipes */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{
                    bgcolor: '#E91E63',
                    color: 'white',
                    p: 1.5,
                    borderRadius: 2,
                    mr: 2
                  }}>
                    <FavoriteIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Favorite Recipes
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {analytics.totalFavorites.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Across all users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Meal Plans */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{
                    bgcolor: '#00BCD4',
                    color: 'white',
                    p: 1.5,
                    borderRadius: 2,
                    mr: 2
                  }}>
                    <CalendarTodayIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Users with Meal Plans
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {analytics.totalMealPlans.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Users planning meals
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Ratings */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-4px)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{
                    bgcolor: '#FFC107',
                    color: 'white',
                    p: 1.5,
                    borderRadius: 2,
                    mr: 2
                  }}>
                    <StarIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Ratings
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {analytics.totalRatings.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  User reviews submitted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Most Reviewed Recipes */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Most Reviewed Recipes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {analytics.mostReviewedRecipes.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No reviews yet
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Recipe Name</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Reviews</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Avg Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.mostReviewedRecipes.map((recipe, index) => (
                          <TableRow
                            key={recipe.id}
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                              bgcolor: index < 3 ? 'action.selected' : 'transparent'
                            }}
                          >
                            <TableCell>
                              <Chip
                                label={index + 1}
                                size="small"
                                color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                                sx={{ minWidth: 32, fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: index < 3 ? 600 : 400 }}>
                                {recipe.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={recipe.reviewCount}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {recipe.averageRating.toFixed(1)}
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Highest Rated Recipes */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Highest Rated Recipes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {analytics.highestRatedRecipes.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No ratings yet
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Recipe Name</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Rating</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Reviews</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.highestRatedRecipes.map((recipe, index) => (
                          <TableRow
                            key={recipe.id}
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                              bgcolor: index < 3 ? 'action.selected' : 'transparent'
                            }}
                          >
                            <TableCell>
                              <Chip
                                label={index + 1}
                                size="small"
                                color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                                sx={{ minWidth: 32, fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: index < 3 ? 600 : 400 }}>
                                {recipe.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                  {recipe.averageRating.toFixed(1)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={recipe.reviewCount}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default AdminDashboard;
