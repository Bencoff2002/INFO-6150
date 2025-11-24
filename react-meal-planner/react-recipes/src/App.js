import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import EditProfile from './pages/EditProfile';
import RecipeDetail from './pages/RecipeDetail';
import Dashboard from './pages/Dashboard';
import MyRecipeBook from './pages/MyRecipeBook';
import RecipeEditor from './pages/RecipeEditor';
import ChangePassword from './pages/ChangePassword';
import MealPlanner from './pages/MealPlanner';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminReviewManagement from './pages/AdminReviewManagement';
import SharedRecipes from './pages/SharedRecipes';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import theme from './theme';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/meal-planner" element={<MealPlanner />} />
              <Route path="/my-recipes" element={<MyRecipeBook />} />
              <Route path="/my-recipes/new" element={<RecipeEditor mode="create" />} />
              <Route path="/my-recipes/:id" element={<RecipeDetail isCustomRecipe={true} />} />
              <Route path="/my-recipes/:id/edit" element={<RecipeEditor mode="edit" />} />
              <Route path="/shared-recipes" element={<SharedRecipes />} />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-users"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminUserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-reviews"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminReviewManagement />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
