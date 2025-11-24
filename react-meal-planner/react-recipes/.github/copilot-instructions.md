# React Recipe App - AI Coding Assistant Instructions

## Project Architecture

This is a **Material UI React app** for recipe management with a **robust 3-tier fallback data system**. The app supports guest browsing and authenticated features (favorites, meal planning, admin dashboard).

### Critical Data Flow Architecture
**Fallback Priority**: Spoonacular API → JSON Server (port 5001) → Mock Data
```jsx
// Required nested provider structure - DO NOT change order
<ThemeProvider theme={theme}>
  <AuthProvider>
    <RecipeDataManager>
      <BrowserRouter>
        {/* App routes */}
      </BrowserRouter>
    </RecipeDataManager>
  </AuthProvider>
</ThemeProvider>
```

## Development Workflow

### Essential Dual Services
```bash
# BOTH required for full functionality
npm start                                    # React dev (port 3000)
json-server --watch db.json --port 5001    # Local cache server
```

### Environment Configuration
```env
REACT_APP_SPOONACULAR_API_KEY=your_key_here
REACT_APP_USE_REAL=true  # Controls API vs fallback behavior
```

### Fallback Testing Strategy
- **Live API**: `REACT_APP_USE_REAL=true` + valid API key
- **Cached data**: `REACT_APP_USE_REAL=false` or invalid key → JSON server
- **Offline mode**: Stop JSON server → mock data fallback

## Service Layer Rules

### ALWAYS Use Main Service (Critical Pattern)
```javascript
// ✅ CORRECT - includes all fallback logic
import { searchRecipes } from '../services/recipeService';

// ❌ NEVER use direct APIs - bypasses fallback system
import { searchRecipes } from '../services/spoonacularAPI';
```

### Hook-First Development Pattern
```javascript
// ✅ Standard pattern - state management included
const { recipes, loading, error, searchRecipes } = useRecipes();

// ✅ For single recipe details
const { recipe, loading, error } = useRecipeDetails(recipeId);
```

## Authentication Architecture

### User State & Activity Tracking
- Persistence: `localStorage` + React Context
- Session tracking: Auto-ping every minute, cleanup every 15 minutes
- Activity monitoring: Mouse, keyboard, click, scroll events

### Protection Pattern
```jsx
// Admin route protection pattern
<Route path="/admin-*" element={
  <ProtectedRoute requireAdmin={true}>
    <AdminComponent />
  </ProtectedRoute>
} />
```

### Auth Integration Points
- Favorites sync automatically on login/logout
- Session cleanup on unmount with final time calculation
- Activity tracking updates `lastPing` and `totalTimeSpent`

## Material UI Theme Standards

### Custom Theme (theme.js)
- Primary color: FF9F29 (orange)
- Border radius: 16px (cards), 12px (chips/inputs), 20px (buttons) 
- Button text: textTransform 'none'
- Card shadows: 0px 4px 20px rgba(0, 0, 0, 0.05)

### Component Standards
- Recipe cards: `maxWidth: 345px` in grid layouts
- Loading states: Material UI `CircularProgress`
- Error states: `Alert` with `severity="error"`

## Data Model Conventions

### JSON Server Schema (db.json)
```javascript
// Core collections - maintain these structures
users: {
  id, email, password, name, isAdmin, preferences[],
  totalTimeSpent, lastActive, lastPing, active, createdAt
}
favorites: { userId, recipeId, title, image, notes }
externalRecipes: { spoonacularId, title, image, source: 'spoonacular' }
myRecipes: { userId, title, ingredients[], instructions, createdAt }
```

### Data Deduplication Strategy
- Always check `spoonacularId` before caching external recipes
- Use `checkRecipeExists()` in `recipeService.js`
- Prevent duplicate API responses in JSON server

## Routing Conventions

### Route Structure Patterns
- External recipes: `/recipe/:id` (Spoonacular data)
- User recipes: `/my-recipes/:id` (custom recipes)
- Admin pages: `/admin-*` prefix pattern
- Recipe editing: `/my-recipes/:id/edit` vs `/my-recipes/new`

## Error Handling Philosophy

### Graceful Degradation Strategy
- Silent fallbacks between data sources
- User-friendly error messages (no technical details)
- Console logging with emojis: 🔍 ✅ ⚠️ ❌

### Loading State Management
- Prevent multiple concurrent requests with `loading` state checks
- Use Material UI loading components consistently
- Implement skeleton states for recipe cards during search

## Performance Patterns

### API Rate Limit Management (150 requests/day)
- Cache ALL Spoonacular responses in JSON server
- Use mock data during development to preserve quota
- Check console for fallback source indicators

### Component Optimization Rules
- `useCallback` for event handlers passed to children
- Memoize expensive recipe transformations
- Lazy load admin components to reduce bundle size

## File Organization Rules

### Service Layer Structure (Critical)
- `recipeService.js`: Main service with fallback logic - use this
- `jsonServerAPI.js`: JSON server operations only
- `spoonacularAPI.js`: External API wrapper only
- `mockData.js`: Fallback data definitions

### Component Hierarchy
- `pages/`: Route-level components
- `components/`: Reusable UI (Navbar, RecipeCard, SearchBar)
- `components/admin/`: Admin-specific components
- `hooks/`: Custom React hooks (useRecipes, useRecipeDetails)

## Development Guidelines

### New Feature Development Order
1. Add mock data to `mockData.js`
2. Extend JSON server schema in `db.json`
3. Implement service functions with error handling
4. Create/update hooks for state management
5. Build UI components with loading/error states

### Debug & Testing
- Enable logging: `localStorage.setItem('debug-recipes', 'true')`
- Test all three fallback layers during development
- Check console for detailed source and error information