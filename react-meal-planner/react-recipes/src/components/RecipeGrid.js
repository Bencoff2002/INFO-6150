import React from 'react';
import { Box } from '@mui/material';
import RecipeCard from './RecipeCard';

// Reusable responsive grid for recipe cards
// Props:
// - items: array of recipe-like objects { id, title, image, summary?, servings?, readyInMinutes?, rating? }
// - renderCard?: (item) => ReactNode (defaults to <RecipeCard recipe={item} rating={item.rating} />)
// - columns?: object for gridTemplateColumns breakpoints
// - gap?: spacing between cards
export default function RecipeGrid({
    items = [],
    renderCard,
    columns = { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
    gap = 3,
}) {
    const render = renderCard || ((item) => <RecipeCard recipe={item} rating={item.rating} />);

    if (!items || items.length === 0) return null;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: columns,
                gap,
            }}
        >
            {items.map((item) => (
                <Box key={item.id || item.recipeId} sx={{ aspectRatio: '1/1.2', display: 'flex' }}>
                    {render(item)}
                </Box>
            ))}
        </Box>
    );
}
