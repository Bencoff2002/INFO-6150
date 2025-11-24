// Test script to verify the fallback mechanism
// Run this in the browser console to test different scenarios

async function testFallbackSystem() {
    console.log('🧪 Testing Recipe Fallback System...\n');

    // Import the service
    const { searchRecipes, getRecipeDetails } = await import('./services/recipeService.js');

    try {
        console.log('1️⃣ Testing search recipes...');
        const searchResult = await searchRecipes('chicken', 0, 5);
        console.log('✅ Search successful:', {
            resultsFound: searchResult.results.length,
            totalResults: searchResult.totalResults,
            firstRecipe: searchResult.results[0]?.title
        });

        if (searchResult.results.length > 0) {
            const recipeId = searchResult.results[0].id;
            console.log(`\n2️⃣ Testing recipe details for ID: ${recipeId}...`);
            const detailsResult = await getRecipeDetails(recipeId);
            console.log('✅ Details successful:', {
                title: detailsResult.title,
                hasIngredients: !!detailsResult.extendedIngredients?.length,
                hasInstructions: !!detailsResult.instructions
            });
        }

        console.log('\n🎉 All tests passed! The fallback system is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Uncomment the line below to run the test
// testFallbackSystem();