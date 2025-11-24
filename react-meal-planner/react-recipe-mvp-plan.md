# 7-Day MVP Plan: React Recipe Finder

Great project to learn React! Let me break this down into a realistic MVP that focuses on core features and learning. We'll skip some advanced features for now but build a solid foundation.

## **MVP Scope (What We're Building)**

**Week 1 Focus:**
- ✅ Guest: Search recipes, view details, see random recipe
- ✅ User: Register/Login, Save favorites, Basic profile
- ✅ Core React concepts: Hooks (useState, useEffect, custom hooks), Context API, React Router
- ❌ **Skip for MVP**: Meal planner, admin panel, reviews, custom recipes, advanced search filters

---

## **Day 1: Project Setup & Basic Structure**

### Morning (3-4 hours)
**Goal: Get everything running locally**

1. **Create React App & Install Dependencies**
```bash
npx create-react-app react-recipes
cd react-recipes
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom axios
npm install -g json-server  # Install globally
```

2. **Set up JSON-Server**
- Create a `db.json` file in your project root:
```json
{
  "users": [],
  "favorites": []
}
```
- Run it: `json-server --watch db.json --port 5000`

3. **Get Spoonacular API Key**
- Sign up at https://spoonacular.com/food-api
- Save your API key (you get 150 free requests/day)

4. **Create Project Structure**
```
src/
├── components/
│   ├── Navbar.js
│   └── RecipeCard.js
├── pages/
│   ├── Home.js
│   ├── RecipeDetail.js
│   ├── Login.js
│   └── Profile.js
├── context/
│   └── AuthContext.js
├── services/
│   ├── spoonacularAPI.js
│   └── jsonServerAPI.js
├── App.js
└── index.js
```

### Afternoon (3-4 hours)
**Goal: Build the basic routing and navbar**

5. **Set up React Router in `App.js`**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* More routes later */}
      </Routes>
    </BrowserRouter>
  );
}
```

6. **Create a Material UI Navbar** (`components/Navbar.js`)
- AppBar with title
- Links to Home, Login (we'll add more later)

7. **Create API service files**
- `services/spoonacularAPI.js`: Set up axios instance with your API key
- `services/jsonServerAPI.js`: Set up axios for localhost:5000

**End of Day 1 Checklist:**
- ✅ Project runs without errors
- ✅ Can navigate between blank pages
- ✅ Navbar shows up
- ✅ JSON-server is running

---

## **Day 2: Search & Display Recipes (Guest Features)**

### Morning (3-4 hours)
**Goal: Connect to Spoonacular API and display recipes**

1. **Build the Search Component** (on `Home.js`)
```jsx
import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState([]);

  const handleSearch = async () => {
    // Call Spoonacular API here
  };

  return (
    <Box sx={{ p: 3 }}>
      <TextField 
        label="Search recipes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button onClick={handleSearch}>Search</Button>
      {/* Display recipes here */}
    </Box>
  );
}
```

2. **Implement Spoonacular Search** in `services/spoonacularAPI.js`
```javascript
import axios from 'axios';

const API_KEY = 'your_key_here';
const BASE_URL = 'https://api.spoonacular.com';

export const searchRecipes = async (query) => {
  const response = await axios.get(
    `${BASE_URL}/recipes/complexSearch`,
    { params: { apiKey: API_KEY, query, number: 12 } }
  );
  return response.data.results;
};
```

### Afternoon (3-4 hours)
**Goal: Create recipe cards with Material UI**

3. **Build RecipeCard Component** (`components/RecipeCard.js`)
```jsx
import { Card, CardMedia, CardContent, Typography } from '@mui/material';

function RecipeCard({ recipe }) {
  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardMedia
        component="img"
        height="200"
        image={recipe.image}
        alt={recipe.title}
      />
      <CardContent>
        <Typography variant="h6">{recipe.title}</Typography>
      </CardContent>
    </Card>
  );
}
```

4. **Display Recipe Grid on Home Page**
- Use Material UI Grid to show recipes in a responsive grid
- Map through `recipes` array and render `RecipeCard` components

5. **Add "Random Recipe of the Day"**
- Create a separate API call to get 1 random recipe
- Display it prominently at the top of the home page
- Use `useEffect` to load it when page loads

**End of Day 2 Checklist:**
- ✅ Can search for recipes
- ✅ Recipes display in a nice grid
- ✅ Random recipe shows on homepage
- ✅ Understanding of useState and useEffect

---

## **Day 3: Recipe Detail Page**

### Full Day (6-8 hours)
**Goal: Show complete recipe information**

1. **Create Route for Recipe Detail**
```jsx
<Route path="/recipe/:id" element={<RecipeDetail />} />
```

2. **Fetch Recipe Details** (new API function)
```javascript
export const getRecipeDetails = async (id) => {
  const response = await axios.get(
    `${BASE_URL}/recipes/${id}/information`,
    { params: { apiKey: API_KEY } }
  );
  return response.data;
};
```

3. **Build RecipeDetail Page** (`pages/RecipeDetail.js`)
- Use `useParams` from react-router to get recipe ID from URL
- Use `useEffect` to fetch recipe details when component loads
- Display:
  - Recipe image (large)
  - Title
  - Ingredients list (Material UI List component)
  - Instructions (step by step)
  - Nutrition facts (if available)

4. **Add Loading State**
```jsx
const [loading, setLoading] = useState(true);
const [recipe, setRecipe] = useState(null);

useEffect(() => {
  setLoading(true);
  getRecipeDetails(id).then(data => {
    setRecipe(data);
    setLoading(false);
  });
}, [id]);
```

5. **Make RecipeCard Clickable**
- Wrap card in Material UI `Link` or use `useNavigate` hook
- Navigate to `/recipe/:id` when clicked

**End of Day 3 Checklist:**
- ✅ Clicking a recipe navigates to detail page
- ✅ Detail page shows all recipe information
- ✅ Loading states work properly
- ✅ Comfortable with useEffect and useParams

---

## **Day 4: Authentication System**

### Morning (3-4 hours)
**Goal: Build Context API for authentication**

1. **Create AuthContext** (`context/AuthContext.js`)
```jsx
import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // Check localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email, password) => {
    // Call JSON-server to verify credentials
  };

  const register = async (email, password, name) => {
    // Create new user in JSON-server
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

2. **Wrap App with AuthProvider** (in `index.js` or `App.js`)

### Afternoon (3-4 hours)
**Goal: Create Login/Register forms**

3. **Build Login Page** (`pages/Login.js`)
- Material UI form with email & password fields
- Use `useAuth` hook to access login function
- Navigate to home after successful login

4. **Build Register Page** (similar to Login)
- Additional field for name
- Call `register` function from context

5. **Update Navbar**
- Show "Login" button when logged out
- Show "Profile" and "Logout" when logged in
- Use `useAuth` to check user state

6. **Implement JSON-Server Auth Functions**
```javascript
// In services/jsonServerAPI.js
export const loginUser = async (email, password) => {
  const response = await axios.get('http://localhost:5000/users', {
    params: { email }
  });
  const user = response.data[0];
  if (user && user.password === password) {
    return user;
  }
  throw new Error('Invalid credentials');
};
```

**End of Day 4 Checklist:**
- ✅ Users can register and login
- ✅ Auth state persists across page refreshes
- ✅ Navbar updates based on auth state
- ✅ Understanding Context API and custom hooks

---

## **Day 5: Favorites System**

### Morning (3-4 hours)
**Goal: Add favorites functionality**

1. **Create FavoritesContext** (or add to AuthContext)
```jsx
const [favorites, setFavorites] = useState([]);

const addFavorite = async (recipe) => {
  if (!user) return; // Must be logged in
  
  const newFavorite = {
    userId: user.id,
    recipeId: recipe.id,
    title: recipe.title,
    image: recipe.image
  };
  
  const response = await axios.post(
    'http://localhost:5000/favorites',
    newFavorite
  );
  
  setFavorites([...favorites, response.data]);
};
```

2. **Add Favorite Button to RecipeCard and Detail Page**
```jsx
import { IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

<IconButton onClick={() => addFavorite(recipe)}>
  <FavoriteIcon color={isFavorited ? "error" : "default"} />
</IconButton>
```

### Afternoon (3-4 hours)
**Goal: Display favorites and build profile page**

3. **Create Profile Page** (`pages/Profile.js`)
- Display user info
- Show all favorited recipes in a grid
- Add button to remove from favorites

4. **Load Favorites When User Logs In**
```jsx
useEffect(() => {
  if (user) {
    axios.get(`http://localhost:5000/favorites?userId=${user.id}`)
      .then(response => setFavorites(response.data));
  }
}, [user]);
```

5. **Implement Remove Favorite**
```javascript
const removeFavorite = async (favoriteId) => {
  await axios.delete(`http://localhost:5000/favorites/${favoriteId}`);
  setFavorites(favorites.filter(f => f.id !== favoriteId));
};
```

**End of Day 5 Checklist:**
- ✅ Can add/remove favorites
- ✅ Favorites persist in database
- ✅ Profile page shows user's favorites
- ✅ Favorites only work when logged in

---

## **Day 6: Polish & Error Handling**

### Morning (3-4 hours)
**Goal: Add proper loading and error states**

1. **Create Custom Hook for API Calls** (`hooks/useRecipeSearch.js`)
```jsx
import { useState } from 'react';

export function useRecipeSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const searchRecipes = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const results = await spoonacularAPI.searchRecipes(query);
      setData(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, searchRecipes };
}
```

2. **Add Loading Spinners**
- Use Material UI `CircularProgress` component
- Show when fetching data

3. **Add Error Messages**
- Use Material UI `Alert` component
- Display API errors to users

### Afternoon (3-4 hours)
**Goal: Improve UX and styling**

4. **Add Protected Routes**
```jsx
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

<Route 
  path="/profile" 
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  } 
/>
```

5. **Improve Styling**
- Add consistent spacing and padding
- Use Material UI theme colors
- Make it responsive (test on mobile view)
- Add hover effects to cards

6. **Add Empty States**
- "No recipes found" message
- "No favorites yet" on profile page

**End of Day 6 Checklist:**
- ✅ Loading states everywhere
- ✅ Error messages display properly
- ✅ Protected routes work
- ✅ App looks polished

---

## **Day 7: Testing & Deployment Prep**

### Morning (3-4 hours)
**Goal: Test everything and fix bugs**

1. **Test User Flows**
- Guest: Search → View detail
- User: Register → Login → Add favorite → View profile
- Logout and login again (check persistence)

2. **Fix Any Bugs**
- Check console for errors
- Test edge cases (empty search, invalid recipe ID)
- Ensure data persists correctly

3. **Add Final Touches**
- Add a footer
- Improve home page layout
- Add instructions/help text for users

### Afternoon (2-3 hours)
**Goal: Documentation and optional deployment**

4. **Create README.md**
- How to run the project
- API setup instructions
- Feature list

5. **Optional: Deploy Frontend**
- Deploy React app to Vercel or Netlify
- Note: JSON-Server can't be deployed easily (use cloud service or keep it local)

6. **Code Cleanup**
- Remove console.logs
- Add comments to complex code
- Check for unused imports

**End of Day 7 Checklist:**
- ✅ All core features working
- ✅ No major bugs
- ✅ Code is documented
- ✅ Ready to show/submit

---

## **Key Learning Checkpoints**

By the end of this week, you'll have learned:

1. **useState & useEffect**: Throughout Days 1-7
2. **Context API**: Days 4-5 (AuthContext)
3. **Custom Hooks**: Day 6 (useRecipeSearch)
4. **React Router**: Days 1-3 (navigation)
5. **API Integration**: Days 2-3 (external API)
6. **Form Handling**: Day 4 (login/register)
7. **Conditional Rendering**: Throughout all days

---

## **Tips for Success**

1. **Start each day by running both servers:**
```bash
npm start  # React app (Terminal 1)
json-server --watch db.json --port 5000  # Backend (Terminal 2)
```

2. **Console.log Everything**: When learning, log data to understand what's happening

3. **Don't Skip Days**: Each day builds on the previous

4. **Save API Calls**: You only get 150/day with free Spoonacular - use sample data when testing styling

5. **Commit to Git Daily**: Save your progress!

6. **Take Breaks**: Don't burn out - this is a learning experience

---

## **What We're NOT Building (For Now)**

Save these for after your MVP:
- ❌ Meal Planner (complex, requires many API calls)
- ❌ Admin Dashboard (add once you master basics)
- ❌ Reviews system (can add later)
- ❌ Custom recipes (not core to learning React concepts)
- ❌ Advanced search filters (start with simple search)

You can add these features after completing the MVP and understanding the core concepts better!

---

## **Daily Time Commitment**

- Days 1-2: ~6-8 hours each
- Days 3-6: ~6-8 hours each
- Day 7: ~5-6 hours

**Total: ~45-50 hours of focused work**

---

## **Need Help?**

If you get stuck on any day:
1. Check the browser console for errors
2. Review the React documentation
3. Check Material UI component docs
4. Ask for specific code examples

**Ready to start?** Begin with Day 1 setup and good luck! 🚀