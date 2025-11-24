# Recipe API Integration with Fallback System

## Overview

This implementation provides a robust recipe data system with multiple fallback layers to ensure the application always has access to recipe data, regardless of external API availability.

## Architecture

### 🔄 Fallback Priority System

1. **Primary**: Spoonacular API (Real-time data)
2. **Secondary**: JSON Server (Cached data)  
3. **Tertiary**: Mock Data (Offline fallback)

### 📁 File Structure

```
src/
├── services/
│   ├── recipeService.js      # Main service with fallback logic
│   ├── spoonacularAPI.js     # Spoonacular API wrapper
│   └── mockData.js           # Local mock data
├── hooks/
│   └── useRecipes.js         # React hook for recipe state management
├── components/
│   └── RecipeDataManager.js  # Database initialization component
└── test-fallback.js          # Testing utilities
```

## Key Features

### ✅ Automatic Fallback
- Seamlessly switches between data sources
- No user intervention required
- Graceful error handling

### ✅ Data Synchronization  
- Fetched recipes are automatically cached in JSON server
- Prevents duplicate entries with `spoonacularId` checking
- Enables offline functionality

### ✅ Performance Optimization
- Local caching reduces API calls
- Pagination support
- Efficient data fetching

## Configuration

### Environment Variables (.env)
```env
REACT_APP_SPOONACULAR_API_KEY=your_api_key_here
REACT_APP_SPOONACULAR_API_URL=https://api.spoonacular.com/
REACT_APP_USE_REAL=true  # Enable real API calls
```

### JSON Server Schema
The system adds an `externalRecipes` collection to db.json:

```json
{
  "externalRecipes": [
    {
      "id": 1,
      "spoonacularId": 716429,
      "title": "Pasta with Garlic, Scallions, and Herbs",
      "image": "https://...",
      "readyInMinutes": 45,
      "servings": 2,
      "summary": "...",
      "instructions": "...",
      "extendedIngredients": [...],
      "cuisines": ["Mediterranean"],
      "dishTypes": ["lunch", "main course"],
      "diets": ["dairy free"],
      "createdAt": "2025-11-05T...",
      "source": "spoonacular"
    }
  ]
}
```

## Usage Examples

### Basic Recipe Search
```javascript
import { useRecipes } from '../hooks/useRecipes';

function MyComponent() {
    const { recipes, loading, error, searchRecipes } = useRecipes();
    
    const handleSearch = async () => {
        await searchRecipes('pasta', 0, 12, { diet: 'vegetarian' });
    };
    
    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            {recipes.map(recipe => (
                <div key={recipe.id}>{recipe.title}</div>
            ))}
        </div>
    );
}
```

### Direct Service Usage
```javascript
import { searchRecipes, getRecipeDetails } from '../services/recipeService';

// Search with fallback
const results = await searchRecipes('chicken', 0, 20);

// Get details with fallback  
const recipe = await getRecipeDetails(123456);
```

## API Functions

### recipeService.js

#### `searchRecipes(query, offset, number, category)`
- **Purpose**: Search recipes with automatic fallback
- **Parameters**:
  - `query` (string): Search term
  - `offset` (number): Pagination offset  
  - `number` (number): Number of results
  - `category` (object|string): Filter category
- **Returns**: `{ results: [], totalResults: number, offset: number }`

#### `getRecipeDetails(id)`
- **Purpose**: Get detailed recipe information
- **Parameters**: `id` (number): Recipe ID
- **Returns**: Recipe object with full details

#### `getRandomRecipes(number)`
- **Purpose**: Get random recipe suggestions
- **Parameters**: `number` (number): Number of recipes
- **Returns**: `{ results: [], totalResults: number, offset: 0 }`

#### `initializeRecipeDatabase()`
- **Purpose**: Populate JSON server with initial recipe data
- **Usage**: Called automatically by RecipeDataManager
- **Returns**: Promise resolving when complete

### useRecipes.js Hook

#### State Management
- `recipes`: Current recipe array
- `loading`: Loading state boolean
- `error`: Error message string  
- `totalResults`: Total available results
- `currentOffset`: Current pagination offset

#### Methods
- `searchRecipes()`: Search with state update
- `getRandomRecipes()`: Get random recipes with state update
- `loadMoreRecipes()`: Load next page
- `clearRecipes()`: Reset state

## Error Handling

### Fallback Behavior
1. **Spoonacular API Fails**: Automatically tries JSON server
2. **JSON Server Fails**: Falls back to mock data
3. **All Sources Fail**: Returns empty results with error message

### Console Logging
The system provides detailed console logs:
- 🔍 API attempt messages
- ✅ Success confirmations  
- ⚠️ Fallback warnings
- ❌ Error details

## Testing

### Manual Testing
1. **API Available**: Normal operation with real data
2. **API Unavailable**: Set `REACT_APP_USE_REAL=false` to test JSON server fallback
3. **Server Unavailable**: Stop JSON server to test mock data fallback

### Test Script
```javascript
// Run in browser console
import('./test-fallback.js').then(module => {
    // Uncomment the test call in the file to run
});
```

## Database Initialization

### Automatic Setup
The `RecipeDataManager` component handles database initialization:
- Checks if recipes exist in JSON server
- Fetches initial recipes from Spoonacular if empty
- Provides manual initialization option
- Handles initialization errors gracefully

### Manual Control
Users can:
- Skip initialization (use mock data only)
- Retry failed initialization
- Control auto-initialization via localStorage

## Performance Considerations

### Caching Strategy
- Recipes cached indefinitely in JSON server
- Duplicate prevention via `spoonacularId` lookup
- Efficient pagination with offset-based queries

### API Rate Limits
- Spoonacular free tier: 150 requests/day
- Caching reduces API usage significantly  
- JSON server provides unlimited local queries

## Migration Guide

### From spoonacularAPI.js
Replace imports:
```javascript
// Before
import { searchRecipes } from '../services/spoonacularAPI';

// After  
import { searchRecipes } from '../services/recipeService';
```

### Component Updates
Replace direct API calls with hook:
```javascript
// Before
const [recipes, setRecipes] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
    searchRecipes('pasta').then(setRecipes);
}, []);

// After
const { recipes, loading, searchRecipes } = useRecipes();

useEffect(() => {
    searchRecipes('pasta');
}, []);
```

## Troubleshooting

### Common Issues

#### "JSON server not available"
- Ensure JSON server is running on port 5001
- Check `db.json` exists and is valid JSON
- Verify `externalRecipes` collection exists

#### "Recipe not found"
- Recipe may not exist in current data source
- Try different search terms
- Check console for fallback messages

#### "API key invalid"
- Verify `REACT_APP_SPOONACULAR_API_KEY` in .env
- Ensure API key has remaining quota
- Check Spoonacular dashboard for key status

### Debug Mode
Enable detailed logging by setting:
```javascript
localStorage.setItem('debug-recipes', 'true');
```

## Future Enhancements

### Planned Features
- Recipe favoriting across data sources
- Advanced filtering and search
- Recipe recommendation engine
- Offline-first PWA support
- Background data synchronization

### Extensibility
The system is designed to easily add new data sources:
1. Implement source-specific functions
2. Add fallback logic to recipeService.js
3. Update priority order as needed

## Security Considerations

- API keys stored in environment variables
- No sensitive data in localStorage
- Input sanitization for search queries
- Rate limiting awareness and handling