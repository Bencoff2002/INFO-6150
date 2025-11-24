import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Alert,
    Typography,
    Container,
    Chip,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { searchRecipes, getRandomRecipes } from '../services/recipeService';
import RecipeCard from '../components/RecipeCard';
import Navbar from '../components/Navbar';

function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // activeCategory holds the selected category object (label + API mapping)
    const [activeCategory, setActiveCategory] = useState({ label: 'All Types', value: null });
    const [currentPage, setCurrentPage] = useState(1);
    const recipesPerPage = 8;
    const [totalResults, setTotalResults] = useState(0);
    const [isSearchMode, setIsSearchMode] = useState(false); // results from search/category

    const handleSearch = async (newSearch = false) => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        setError(null);

        try {
            // include active category when searching
            const categoryValue = activeCategory?.value ?? null;
            const res = await searchRecipes(searchTerm, 0, recipesPerPage, categoryValue); // page 1
            // update UI results
            setRecipes(res.results);
            setTotalResults(res.totalResults ?? res.results?.length ?? 0);
            setCurrentPage(1);
            setIsSearchMode(true);
            return res;
        } catch (e) {
            setError('Failed to search recipes');
        } finally {
            setLoading(false);
        }
    };

    // (removed unused helper)

    // Fetch a specific page from the service based on current filters/search
    const fetchPage = async (page) => {
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setLoading(true);
        setError(null);
        try {
            const offset = (page - 1) * recipesPerPage;
            const categoryValue = activeCategory?.value ?? null;
            const res = await searchRecipes(searchTerm || '', offset, recipesPerPage, categoryValue);
            setRecipes(res.results);
            setTotalResults(res.totalResults ?? res.results?.length ?? 0);
            setCurrentPage(page);
            setIsSearchMode(true);
        } catch (err) {
            setError('Failed to load page');
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (category) => {
        // avoid redundant refetch if clicking the same non-All category
        if (activeCategory?.label === category?.label && category?.value) return;

        // IMPORTANT: Clear recipes immediately to prevent showing stale data
        setRecipes([]);
        setActiveCategory(category);
        setCurrentPage(1);
        setSearchTerm('');

        // If "All Types" reset to initial/random results and exit search mode
        if (!category?.value) {
            (async () => {
                setLoading(true);
                setError(null);
                try {
                    const res = await getRandomRecipes(12);
                    setRecipes(res.results);
                    setTotalResults(res.totalResults ?? res.results?.length ?? 0);
                    setIsSearchMode(false);
                } catch (err) {
                    setError('Failed to load recipes');
                    setRecipes([]);
                } finally {
                    setLoading(false);
                }
            })();
            return;
        }

        // Otherwise, fetch filtered results from the service (mock supports category object)
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await searchRecipes('', 0, recipesPerPage, category.value);
                setRecipes(res.results);
                setTotalResults(res.totalResults ?? res.results?.length ?? 0);
                setIsSearchMode(true);
            } catch (err) {
                setError('Failed to filter recipes');
                setRecipes([]);
            } finally {
                setLoading(false);
            }
        })();
    };

    useEffect(() => {
        const loadRecipes = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getRandomRecipes(12);
                setRecipes(res.results);
                setTotalResults(res.totalResults ?? res.results?.length ?? 0);
                setIsSearchMode(false);
            } catch (e) {
                setError('Failed to load recipes');
            } finally {
                setLoading(false);
            }
        };
        loadRecipes();
    }, []);

    // Categories map to Spoonacular "type" values (see API):
    // main course, side dish, dessert, appetizer, salad, bread, breakfast, soup, beverage, sauce, marinade, fingerfood, snack, drink
    const categories = [
        { label: 'All', icon: '🍽️', value: null },
        { label: 'Appetizers', icon: '🍜', value: { types: ['appetizer', 'fingerfood', 'snack'] } },
        { label: 'Main Course', icon: '🍖', value: { types: ['main course'] } },
        { label: 'Salads & Sides', icon: '🥗', value: { types: ['salad', 'side dish'] } },
        { label: 'Vegetarian', icon: '🥕', value: { diet: 'vegetarian' } },
        { label: 'Breakfast', icon: '☀️', value: { types: ['breakfast'] } },
        { label: 'Dessert', icon: '🍰', value: { types: ['dessert'] } },
        { label: 'Soups', icon: '🍲', value: { types: ['soup'] } },
        { label: 'Drinks', icon: '🥤', value: { types: ['beverage', 'drink'] } },
        { label: 'Quick & Easy', icon: '⚡', value: { quickEasy: true } }
    ];

    return (
        <>
            <Navbar
                onSearch={handleSearch}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                loading={loading}
            />
            <Box sx={{ pt: 7, minHeight: '100vh', backgroundColor: 'background.default' }}>
                <Container maxWidth="lg">
                    {/* Hero Section */}
                    <Box sx={{ textAlign: 'center', py: 4 }}> {/* Reduced vertical padding */}
                        <Typography
                            variant="h2" // Changed from h1 to h2
                            sx={{
                                mb: 1, // Reduced margin
                                fontSize: { xs: '1.75rem', md: '2rem' }, // Reduced font sizes
                                fontWeight: 600
                            }}
                        >
                            Explore <Box component="span" sx={{ color: 'primary.main' }}>Culinary</Box> Insights
                        </Typography>

                        <Typography
                            variant="h6" // Changed from h5 to h6
                            color="text.secondary"
                            sx={{
                                mb: 3, // Reduced margin
                                fontSize: { xs: '1rem', md: '1.1rem' } // Reduced font sizes
                            }}
                        >
                            Discover amazing recipes for every taste
                        </Typography>

                        {/* Categories */}
                        <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                            {categories.map((category) => (
                                <Chip
                                    key={category.label}
                                    label={category.label}
                                    icon={<span>{category.icon}</span>}
                                    onClick={() => handleCategorySelect(category)}
                                    color={activeCategory?.label === category.label ? "primary" : "default"}
                                    sx={{
                                        borderRadius: 2,
                                        px: 1,
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                            color: 'white'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Recipe Grid */}
                    {recipes.length > 0 && (
                        <Box sx={{ mb: 6 }}>
                            {/* <Typography variant="h4" sx={{ mb: 3, fontSize: '1.5rem' }}>
                                {activeCategory !== 'All Types' && activeCategory}
                            </Typography> */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            sm: 'repeat(2, 1fr)',
                                            md: 'repeat(4, 1fr)'
                                        },
                                        gap: 3
                                    }}
                                >
                                    {recipes.map((recipe) => (
                                        <Box
                                            key={recipe.id}
                                            sx={{
                                                aspectRatio: '1/1.2',
                                                display: 'flex'
                                            }}
                                        >
                                            <RecipeCard recipe={recipe} />
                                        </Box>
                                    ))}
                                </Box>

                                {/* Pagination */}
                                {totalResults > recipesPerPage && (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        mt: 6,
                                        mb: 4,
                                        gap: 3,
                                        py: 2
                                    }}>
                                        <Button
                                            onClick={() => fetchPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            variant="contained"
                                            startIcon={<ArrowBackIcon />}
                                            sx={{
                                                minWidth: '120px',
                                                fontSize: '1rem',
                                                py: 1.5
                                            }}
                                        >
                                            Previous
                                        </Button>

                                        <Typography variant="h6" sx={{
                                            minWidth: '140px',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            color: 'primary.main'
                                        }}>
                                            Page {currentPage} of {Math.ceil(totalResults / recipesPerPage)}
                                        </Typography>

                                        <Button
                                            onClick={() => fetchPage(currentPage + 1)}
                                            disabled={currentPage >= Math.ceil(totalResults / recipesPerPage)}
                                            variant="contained"
                                            endIcon={<ArrowForwardIcon />}
                                            sx={{
                                                minWidth: '120px',
                                                fontSize: '1rem',
                                                py: 1.5
                                            }}
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {!loading && searchTerm && recipes.length === 0 && (
                        <Alert
                            severity="info"
                            sx={{
                                maxWidth: 600,
                                mx: 'auto',
                                mt: 4,
                                borderRadius: 2
                            }}
                        >
                            No recipes found for "{searchTerm}". Try different keywords!
                        </Alert>
                    )}
                </Container>
            </Box>
        </>
    );
}

export default Home;