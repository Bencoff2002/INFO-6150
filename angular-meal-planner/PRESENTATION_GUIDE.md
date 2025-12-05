# Angular Meal Planner - Comprehensive Code Presentation Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Application Structure](#application-structure)
4. [Core Features](#core-features)
5. [Security & Authentication](#security--authentication)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Data Management](#data-management)
8. [Key Components](#key-components)
9. [Services Architecture](#services-architecture)
10. [Routing & Navigation](#routing--navigation)
11. [State Management](#state-management)
12. [Performance Optimizations](#performance-optimizations)
13. [Best Practices Implemented](#best-practices-implemented)

---

## 1. Project Overview

### Purpose
A full-featured meal planning and recipe management application built with Angular 21, designed to help users discover recipes, plan meals, and manage their personal recipe collections.

### Key Capabilities
- 🔍 Recipe search and discovery
- 📅 Meal planning system
- ⭐ Favorites management
- 👤 User authentication & authorization
- 🔐 Role-based access control (Admin/User/Guest)
- 📊 Admin analytics and reporting
- 🍳 Custom recipe creation
- 🤝 Recipe sharing

---

## 2. Architecture & Technology Stack

### Frontend Stack
```typescript
// package.json
{
  "dependencies": {
    "@angular/core": "^21.0.0",           // Latest Angular framework
    "@angular/common": "^21.0.0",         // Common Angular utilities
    "@angular/forms": "^21.0.0",          // Reactive & template-driven forms
    "@angular/router": "^21.0.0",         // Client-side routing
    "rxjs": "~7.8.0",                     // Reactive programming
    "tslib": "^2.3.0"                     // TypeScript runtime library
  }
}
```

### Architecture Pattern
- **Component-Based Architecture**: Modular, reusable components
- **Service-Oriented Design**: Centralized business logic
- **Reactive Programming**: RxJS for async operations
- **Standalone Components**: Modern Angular 21 approach (no NgModules)
- **Guard-Based Security**: Route protection with canActivate guards

---

## 3. Application Structure

### Directory Layout
```
angular-recipes/
├── src/
│   ├── app/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── navbar/
│   │   │   ├── recipe-card/
│   │   │   ├── meal-card/
│   │   │   └── dialogs/
│   │   ├── pages/              # Route components
│   │   │   ├── login/
│   │   │   ├── home/
│   │   │   ├── favourites/
│   │   │   ├── meal-planner/
│   │   │   ├── admin-*/        # Admin pages
│   │   │   └── reports/
│   │   ├── services/           # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── recipe.service.ts
│   │   │   ├── user-recipe.service.ts
│   │   │   └── admin.service.ts
│   │   ├── guards/             # Route protection
│   │   │   ├── auth.guard.ts
│   │   │   ├── user.guard.ts
│   │   │   └── admin.guard.ts
│   │   ├── models/             # TypeScript interfaces
│   │   ├── utils/              # Helper functions
│   │   ├── app.routes.ts       # Route configuration
│   │   └── app.config.ts       # App configuration
│   ├── environments/           # Environment configs
│   └── assets/                 # Static resources
├── db.json                     # JSON Server database
└── package.json
```

---

## 4. Core Features

### 4.1 Recipe Discovery & Search
**Location**: `src/app/home/home.component.ts`

```typescript
// Key Features:
- Category-based filtering (Appetizers, Main Course, Desserts, etc.)
- Text-based search
- Pagination support
- Guest and authenticated user views
- Integration with external recipe API
```

**Technical Implementation**:
```typescript
async handleSearch(term?: string) {
    if (term) this.searchTerm = term;
    if (!this.searchTerm.trim()) return;
    
    this.loading = true;
    try {
        const categoryValue = this.activeCategory?.value ?? null;
        const res = await this.recipeService.searchRecipes(
            this.searchTerm, 
            0, 
            this.recipesPerPage, 
            categoryValue
        );
        this.recipes = res.results;
        this.totalResults = res.totalResults ?? res.results?.length ?? 0;
        this.isSearchMode = true;
    } catch (e) {
        this.error = 'Failed to search recipes';
    } finally {
        this.loading = false;
    }
}
```

### 4.2 User Authentication
**Location**: `src/app/services/auth.service.ts`

**Features**:
- Email/password authentication
- User registration with preferences
- Session management with localStorage
- Account lockout after failed attempts (3 attempts, 2-minute lockout)
- Blocked user validation
- Password change functionality

**Security Measures**:
```typescript
// Multi-layer blocked user validation
constructor() {
    // 1. Constructor-level validation
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        this.validateUserStatus().subscribe();
    }
}

// 2. Login-time validation (before password check)
login(email: string, password: string): Observable<any> {
    return this.http.get<User[]>(`${this.baseUrl}/users?email=${email}`)
        .pipe(
            switchMap(users => {
                const user = users[0];
                if (user && user.isBlocked) {
                    // Blocked check BEFORE password verification
                    return throwError(() => new Error('BLOCKED_USER'));
                }
                // Continue with password validation
            })
        );
}

// 3. Server-side validation for active sessions
validateUserStatus(): Observable<boolean> {
    const user = this.getCurrentUser();
    if (!user) return of(false);
    
    return this.http.get<User>(`${this.baseUrl}/users/${user.id}`)
        .pipe(
            map(serverUser => {
                if (serverUser.isBlocked) {
                    this.logout();
                    return false;
                }
                return true;
            })
        );
}
```

**Lockout Mechanism**:
```typescript
// Prevents brute force attacks
private handleFailedLogin(email: string) {
    const attempts = this.getLoginAttempts(email);
    const newAttempts = attempts + 1;
    localStorage.setItem(`loginAttempts_${email}`, newAttempts.toString());
    
    if (newAttempts >= 3) {
        const lockoutEnd = Date.now() + (2 * 60 * 1000); // 2 minutes
        localStorage.setItem(`lockoutEnd_${email}`, lockoutEnd.toString());
    }
}
```

### 4.3 Meal Planning System
**Location**: `src/app/pages/meal-planner/`

**Features**:
- Weekly meal planning
- Drag-and-drop meal assignment
- Save/Load meal plans
- Nutritional summaries
- Shopping list generation
- Plan sharing

**Data Model**:
```typescript
interface MealPlan {
    id: string;
    userId: string;
    name: string;
    meals: {
        [day: string]: {
            breakfast?: Recipe;
            lunch?: Recipe;
            dinner?: Recipe;
            snack?: Recipe;
        }
    };
    createdAt: string;
    updatedAt: string;
}
```

### 4.4 Favorites System
**Location**: `src/app/services/user-recipe.service.ts`

```typescript
// Add to favorites
async addFavorite(recipeId: number, recipe: any): Promise<void> {
    const favorite = {
        id: Date.now().toString(),
        userId: this.authService.getCurrentUser()?.id,
        recipeId: recipeId,
        recipe: recipe,
        addedAt: new Date().toISOString()
    };
    await this.http.post(`${this.baseUrl}/favorites`, favorite).toPromise();
}

// Remove from favorites
async removeFavorite(favoriteId: string): Promise<void> {
    await this.http.delete(`${this.baseUrl}/favorites/${favoriteId}`).toPromise();
}
```

---

## 5. Security & Authentication

### 5.1 Route Guards
**Location**: `src/app/guards/`

#### Auth Guard (Base Protection)
```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.validateUserStatus().pipe(
        map(isValid => {
            if (!authService.isAuthenticated() || !isValid) {
                router.navigate(['/login']);
                return false;
            }
            return true;
        })
    );
};
```

#### User Guard (User-Specific Routes)
```typescript
// user.guard.ts
export const userGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.validateUserStatus().pipe(
        map(isValid => {
            const user = authService.getCurrentUser();
            
            if (!user || !isValid || user.isBlocked) {
                router.navigate(['/login'], { 
                    queryParams: { blocked: 'true' } 
                });
                return false;
            }
            return true;
        })
    );
};
```

#### Admin Guard (Admin-Only Routes)
```typescript
// admin.guard.ts
export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.validateUserStatus().pipe(
        map(isValid => {
            const user = authService.getCurrentUser();
            
            if (!user || !isValid || !user.isAdmin || user.isBlocked) {
                router.navigate(['/']);
                return false;
            }
            return true;
        })
    );
};
```

### 5.2 Session Management

```typescript
// Periodic validation in navbar
ngOnInit() {
    // Check user status every 30 seconds
    setInterval(() => {
        if (this.user) {
            this.authService.validateUserStatus().subscribe(isValid => {
                if (!isValid) {
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }
            });
        }
    }, 30000);
}
```

---

## 6. User Roles & Permissions

### Role Hierarchy
```
Guest User (Not Authenticated)
  ├─ Can browse recipes
  ├─ Can search recipes
  ├─ Cannot view details (shows popup)
  └─ Cannot access protected features

Registered User (Authenticated)
  ├─ All Guest permissions
  ├─ View recipe details
  ├─ Add to favorites
  ├─ Create meal plans
  ├─ Share recipes
  ├─ Create custom recipes
  └─ Rate and review

Administrator (Authenticated + isAdmin: true)
  ├─ All User permissions
  ├─ User management (grant/revoke admin, block/reinstate)
  ├─ View analytics & statistics
  ├─ Generate reports
  ├─ Access admin dashboard
  └─ System configuration

Blocked User (isBlocked: true)
  ├─ Cannot login
  ├─ Session terminated immediately
  ├─ Redirected to guest home
  └─ Can be reinstated by admin
```

### Permission Implementation
**Location**: `src/app/pages/admin-users/admin-users.component.ts`

```typescript
// Admin user management actions
grantAdminPrivilege(user: User) {
    // Optimistic UI update
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        this.users[userIndex] = { ...user, isAdmin: true };
        this.cdr.detectChanges();
    }
    this.updateUser(user.id, { ...user, isAdmin: true });
}

blockUser(user: User) {
    // Store previous admin status for potential reinstatement
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        this.users[userIndex] = { 
            ...user, 
            isBlocked: true, 
            wasAdmin: user.isAdmin, 
            isAdmin: false 
        };
        this.cdr.detectChanges();
    }
    this.updateUser(user.id, { 
        ...user, 
        isBlocked: true, 
        wasAdmin: user.isAdmin, 
        isAdmin: false 
    });
}

reinstateUser(user: User) {
    // Restore previous admin status if applicable
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        this.users[userIndex] = { 
            ...user, 
            isBlocked: false, 
            isAdmin: user.wasAdmin || false, 
            wasAdmin: undefined 
        };
        this.cdr.detectChanges();
    }
    this.updateUser(user.id, { 
        ...user, 
        isBlocked: false, 
        isAdmin: user.wasAdmin || false, 
        wasAdmin: undefined 
    });
}
```

---

## 7. Data Management

### 7.1 JSON Server Backend
**Location**: `db.json`

```json
{
  "users": [
    {
      "id": "1",
      "name": "Site Administrator",
      "email": "admin@mealrecipe.com",
      "password": "admin",
      "isAdmin": true,
      "isBlocked": false,
      "preferences": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "favorites": [],
  "savedMealPlans": [],
  "sharedRecipes": [],
  "ratings": [],
  "comments": [],
  "viewedRecipes": []
}
```

### 7.2 Service Layer Architecture

#### Recipe Service (API Aggregation)
**Location**: `src/app/services/recipe.service.ts`

```typescript
export class RecipeService {
    constructor(
        private spoonacular: SpoonacularApiService,
        private jsonServer: JsonServerApiService,
        private mockData: MockDataService
    ) {}
    
    async searchRecipes(query: string, offset: number, number: number, filters?: any) {
        try {
            // Try external API first
            return await this.spoonacular.searchRecipes(query, offset, number, filters);
        } catch (error) {
            try {
                // Fallback to JSON Server
                return await this.jsonServer.searchRecipes(query, offset, number);
            } catch (error) {
                // Final fallback to mock data
                return this.mockData.searchRecipes(query, offset, number);
            }
        }
    }
}
```

#### User Recipe Service (User-Specific Data)
**Location**: `src/app/services/user-recipe.service.ts`

```typescript
export class UserRecipeService {
    // Favorites management
    async getFavorites(userId: string): Promise<any[]>
    async addFavorite(recipeId: number, recipe: any): Promise<void>
    async removeFavorite(favoriteId: string): Promise<void>
    
    // Ratings & Reviews
    async getRating(userId: string, recipeId: number): Promise<any>
    async addRating(recipeId: number, rating: number, review?: string): Promise<void>
    
    // Recipe tracking
    async trackRecipeView(recipeId: number): Promise<void>
    
    // Custom recipes
    async createRecipe(recipe: any): Promise<any>
    async updateRecipe(id: string, recipe: any): Promise<any>
    async deleteRecipe(id: string): Promise<void>
}
```

---

## 8. Key Components

### 8.1 Recipe Card Component
**Location**: `src/app/components/recipe-card/recipe-card.component.ts`

**Features**:
- Recipe display with image, title, rating
- Favorite toggle
- Share functionality
- Guest user protection with popups
- Responsive design

**Guest User Handling**:
```typescript
handleClick() {
    if (this.open.observers.length > 0) {
        this.open.emit(this.recipe);
        return;
    }
    
    if (!this.user) {
        alert('Login to view details');  // Popup instead of redirect
        return;
    }
    
    // Navigate to details for authenticated users
    this.router.navigate(['/recipe', this.recipe.id]);
}

async toggleFavorite(event: Event) {
    event.stopPropagation();
    
    if (!this.user) {
        alert('Login to add favorites');
        return;
    }
    
    // Handle favorite logic
}
```

### 8.2 Navbar Component
**Location**: `src/app/components/navbar/navbar.component.ts`

**Features**:
- Dynamic menu based on user role
- Profile dropdown
- Admin quick access
- Logout functionality
- Periodic session validation

```typescript
handleLogout() {
    const isAdmin = this.user?.isAdmin;
    this.authService.logout();
    
    // Differentiated redirect based on role
    if (isAdmin) {
        this.router.navigate(['/login']);
    } else {
        this.router.navigate(['/']);  // Guest home
    }
}
```

### 8.3 Admin Users Management
**Location**: `src/app/pages/admin-users/admin-users.component.ts`

**Features**:
- User list with role badges
- 3-dot menu with context-aware actions
- Optimistic UI updates
- Auto-close menu (5 seconds or click outside)
- Fixed positioning dropdown (z-index: 10000)

**Optimistic Updates**:
```typescript
// Updates UI immediately, then syncs with server
grantAdminPrivilege(user: User) {
    this.closeMenu();
    if (!confirm(`Grant admin privileges to ${user.name}?`)) return;
    
    // 1. Update UI immediately
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        this.users[userIndex] = { ...user, isAdmin: true };
        this.cdr.detectChanges();
    }
    
    // 2. Sync with server (reload on error)
    this.updateUser(user.id, { ...user, isAdmin: true });
}
```

**Menu Auto-Close**:
```typescript
toggleMenu(userId: string, event: MouseEvent) {
    // Calculate fixed position
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    this.menuPosition = {
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
    };
    
    this.openMenuUserId = userId;
    
    // Auto-close after 5 seconds
    this.menuCloseTimer = setTimeout(() => {
        this.closeMenu();
        this.cdr.detectChanges();
    }, 5000);
}

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.openMenuUserId && !target.closest('.action-menu-container')) {
        this.closeMenu();
    }
}
```

---

## 9. Services Architecture

### 9.1 Authentication Service
**Key Methods**:
```typescript
class AuthService {
    // Authentication
    login(email: string, password: string): Observable<any>
    register(userData: any): Observable<any>
    logout(): void
    
    // Session management
    isAuthenticated(): boolean
    getCurrentUser(): User | null
    validateUserStatus(): Observable<boolean>
    
    // User updates
    updateUser(userId: string, updates: Partial<User>): Observable<any>
    changePassword(userId: string, oldPassword: string, newPassword: string): Observable<any>
}
```

### 9.2 Admin Service
**Location**: `src/app/services/admin.service.ts`

**Analytics & Reporting**:
```typescript
class AdminService {
    // Statistics
    getUserCount(): Observable<number>
    getRecipeCount(): Observable<number>
    getMealPlanCount(): Observable<number>
    
    // Reports
    getUserActivityReport(): Observable<any[]>
    getTopRatedRecipes(): Observable<any[]>
    getViewedRecipesReport(): Observable<any[]>
    
    // User management
    getUsers(): Observable<User[]>
    updateUserRole(userId: string, isAdmin: boolean): Observable<any>
    blockUser(userId: string): Observable<any>
    reinstateUser(userId: string): Observable<any>
}
```

---

## 10. Routing & Navigation

### 10.1 Route Configuration
**Location**: `src/app/app.routes.ts`

```typescript
export const routes: Routes = [
    // Public routes
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'shared/:id', component: RecipeDetailComponent },
    
    // User routes (protected by userGuard)
    { 
        path: 'recipe/:id', 
        component: RecipeDetailComponent, 
        canActivate: [userGuard] 
    },
    { 
        path: 'favourites', 
        component: FavouritesComponent, 
        canActivate: [userGuard] 
    },
    { 
        path: 'meal-planner', 
        component: MealPlannerComponent, 
        canActivate: [userGuard] 
    },
    { 
        path: 'my-recipes', 
        component: MyRecipeBookComponent, 
        canActivate: [userGuard] 
    },
    
    // Admin routes (protected by adminGuard)
    { 
        path: 'admin/users', 
        component: AdminUsersComponent, 
        canActivate: [adminGuard] 
    },
    { 
        path: 'admin/statistics', 
        component: AdminStatisticsComponent, 
        canActivate: [adminGuard] 
    },
    { 
        path: 'admin/reports', 
        component: AdminReportsComponent, 
        canActivate: [adminGuard] 
    },
    
    // Fallback
    { path: '**', redirectTo: '' }
];
```

### 10.2 Navigation Guards Flow
```
User navigates to protected route
         ↓
Guard executes (authGuard, userGuard, or adminGuard)
         ↓
Validate user session with server
         ↓
Check authentication status
         ↓
Check user role/permissions
         ↓
Check blocked status
         ↓
Allow access OR redirect to appropriate page
```

---

## 11. State Management

### 11.1 Local State Management
```typescript
// Component-level state
export class HomeComponent {
    recipes: any[] = [];              // Recipe list
    loading = false;                  // Loading indicator
    error: string | null = null;      // Error message
    currentPage = 1;                  // Pagination
    activeCategory: Category;         // Active filter
    searchTerm = '';                  // Search query
}
```

### 11.2 Shared State (Services)
```typescript
// Auth state in AuthService
private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();

// Reactive state updates
updateUser(updates: Partial<User>) {
    const currentUser = this.getCurrentUser();
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
}
```

### 11.3 Change Detection Strategy
```typescript
// Manual change detection for performance
constructor(private cdr: ChangeDetectorRef) {}

async loadData() {
    this.loading = true;
    const data = await this.service.getData();
    this.data = data;
    this.loading = false;
    this.cdr.detectChanges();  // Trigger UI update
}
```

---

## 12. Performance Optimizations

### 12.1 Optimistic UI Updates
```typescript
// Update UI immediately, sync with server in background
deleteUser(user: User) {
    // 1. Optimistic update
    this.users = this.users.filter(u => u.id !== user.id);
    this.cdr.detectChanges();
    
    // 2. Server sync
    this.http.delete(`${this.baseUrl}/users/${user.id}`)
        .pipe(
            catchError(error => {
                // Reload on error to restore correct state
                this.loadUsers();
                return of(null);
            })
        )
        .subscribe();
}
```

### 12.2 Lazy Loading (Future Enhancement)
```typescript
// Routes can be lazy loaded for better initial load time
const routes: Routes = [
    {
        path: 'admin',
        loadChildren: () => import('./admin/admin.routes')
            .then(m => m.ADMIN_ROUTES)
    }
];
```

### 12.3 API Fallback Strategy
```typescript
// Graceful degradation with multiple data sources
async getRecipeDetails(id: number): Promise<any> {
    try {
        return await this.spoonacular.getRecipeDetails(id);
    } catch (error) {
        try {
            return await this.jsonServer.getRecipeDetails(id);
        } catch (error) {
            return this.mockData.getRecipeDetails(id);
        }
    }
}
```

---

## 13. Best Practices Implemented

### 13.1 TypeScript Best Practices
```typescript
// Strong typing
interface User {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
    isBlocked?: boolean;
    wasAdmin?: boolean;
}

// Type-safe service methods
getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
}
```

### 13.2 Error Handling
```typescript
// Comprehensive error handling with RxJS
this.http.get<User[]>(`${this.baseUrl}/users`)
    .pipe(
        timeout(10000),                    // Timeout after 10 seconds
        catchError(error => {
            console.error('API Error:', error);
            this.error = 'Failed to load users';
            return of([]);                 // Return empty array on error
        }),
        finalize(() => {
            this.loading = false;          // Always stop loading
            this.cdr.detectChanges();
        })
    )
    .subscribe(users => {
        this.users = users;
    });
```

### 13.3 Security Best Practices
```typescript
// 1. Input validation
if (!email || !password) {
    return throwError(() => new Error('Email and password required'));
}

// 2. XSS prevention (Angular's built-in sanitization)
// Templates automatically escape content

// 3. CSRF protection
// JSON Server doesn't require CSRF tokens, but production would

// 4. Session validation
// Periodic server-side validation every 30 seconds

// 5. Blocked user enforcement
// Multi-layer validation (constructor, login, guards, periodic)
```

### 13.4 Component Communication
```typescript
// 1. Parent to Child (Input)
@Input() recipe: any;
@Input() isFavorite: boolean = false;

// 2. Child to Parent (Output)
@Output() favoriteToggled = new EventEmitter<any>();

// 3. Service-based communication
private messageSource = new BehaviorSubject<string>('');
currentMessage = this.messageSource.asObservable();

changeMessage(message: string) {
    this.messageSource.next(message);
}
```

### 13.5 Responsive Design
```scss
// Mobile-first approach
.container {
    padding: 1rem;
    
    @media (min-width: 768px) {
        padding: 2rem;
    }
    
    @media (min-width: 1024px) {
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

---

## 14. Database Schema

### Users Table
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string (unique)",
  "password": "string",
  "isAdmin": "boolean",
  "isBlocked": "boolean",
  "wasAdmin": "boolean (optional)",
  "preferences": "array<string>",
  "createdAt": "ISO date string",
  "lastActive": "ISO date string"
}
```

### Favorites Table
```json
{
  "id": "string",
  "userId": "string",
  "recipeId": "number",
  "recipe": "object",
  "addedAt": "ISO date string"
}
```

### Saved Meal Plans Table
```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "meals": {
    "monday": { "breakfast": {}, "lunch": {}, "dinner": {} },
    "tuesday": { ... },
    ...
  },
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

### Ratings Table
```json
{
  "id": "string",
  "userId": "string",
  "recipeId": "number",
  "rating": "number (1-5)",
  "review": "string (optional)",
  "createdAt": "ISO date string"
}
```

### Viewed Recipes Table
```json
{
  "id": "string",
  "userId": "string",
  "recipeId": "number",
  "viewedAt": "ISO date string"
}
```

---

## 15. API Integration

### Spoonacular API Integration
**Location**: `src/app/services/spoonacular-api.service.ts`

```typescript
export class SpoonacularApiService {
    private apiKey = environment.spoonacularApiKey;
    private baseUrl = 'https://api.spoonacular.com';
    
    async searchRecipes(query: string, offset: number, number: number, filters?: any) {
        const params = new URLSearchParams({
            apiKey: this.apiKey,
            query,
            offset: offset.toString(),
            number: number.toString(),
            addRecipeInformation: 'true',
            ...filters
        });
        
        const response = await fetch(`${this.baseUrl}/recipes/complexSearch?${params}`);
        return await response.json();
    }
    
    async getRecipeDetails(id: number) {
        const response = await fetch(
            `${this.baseUrl}/recipes/${id}/information?apiKey=${this.apiKey}`
        );
        return await response.json();
    }
}
```

---

## 16. Testing Strategy (Recommended)

### Unit Testing
```typescript
// Component testing with Angular Testing utilities
describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authService: jasmine.SpyObj<AuthService>;
    
    beforeEach(() => {
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
        
        TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                { provide: AuthService, useValue: authServiceSpy }
            ]
        });
        
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    });
    
    it('should show error for blocked user', () => {
        authService.login.and.returnValue(
            throwError(() => new Error('BLOCKED_USER'))
        );
        
        component.handleSubmit();
        
        expect(component.error).toContain('blocked');
    });
});
```

### Integration Testing
```typescript
// Guard testing
describe('adminGuard', () => {
    it('should allow admin users', (done) => {
        const authService = TestBed.inject(AuthService);
        spyOn(authService, 'getCurrentUser').and.returnValue({
            id: '1',
            isAdmin: true,
            isBlocked: false
        });
        
        const result = TestBed.runInInjectionContext(() =>
            adminGuard({} as any, {} as any)
        );
        
        expect(result).toBe(true);
        done();
    });
});
```

---

## 17. Deployment Considerations

### Production Build
```bash
# Build for production
ng build --configuration production

# Output in dist/ directory
# - Minified JavaScript
# - CSS optimization
# - Tree shaking
# - AOT compilation
```

### Environment Configuration
```typescript
// src/environments/environment.prod.ts
export const environment = {
    production: true,
    apiUrl: 'https://api.yourdomain.com',
    spoonacularApiKey: 'YOUR_PRODUCTION_KEY'
};
```

### Server Requirements
```
Backend:
- JSON Server or equivalent REST API
- Node.js 18+ for JSON Server
- CORS configuration

Frontend:
- Static file hosting (Netlify, Vercel, AWS S3)
- Or Node.js server for SSR
```

---

## 18. Future Enhancements

### Recommended Features
1. **Email Verification**: Verify user emails on registration
2. **Password Reset**: Forgot password functionality
3. **Social Login**: Google/Facebook OAuth integration
4. **Real-time Updates**: WebSocket for live data
5. **PWA Support**: Offline capabilities, push notifications
6. **Advanced Search**: Filters for dietary restrictions, ingredients
7. **Nutritional Analysis**: Detailed macro/micronutrient tracking
8. **Recipe Collections**: User-created recipe collections
9. **Shopping List Integration**: Export to external apps
10. **Meal Prep Timer**: Built-in cooking timer

### Technical Improvements
1. **State Management**: NgRx or Akita for complex state
2. **Lazy Loading**: Route-based code splitting
3. **Server-Side Rendering**: Angular Universal for SEO
4. **GraphQL**: Replace REST with GraphQL API
5. **Unit Testing**: Comprehensive test coverage
6. **E2E Testing**: Cypress or Playwright tests
7. **CI/CD Pipeline**: Automated testing and deployment
8. **Monitoring**: Error tracking (Sentry), analytics
9. **Performance**: Virtual scrolling, image optimization
10. **Accessibility**: WCAG 2.1 AA compliance

---

## 19. Key Takeaways for Presentation

### Technical Achievements
✅ **Modern Angular 21** with standalone components
✅ **Role-Based Access Control** with 3 user levels
✅ **Multi-Layer Security** with periodic validation
✅ **Optimistic UI Updates** for better UX
✅ **Graceful API Fallbacks** for reliability
✅ **Responsive Design** for all devices
✅ **TypeScript Best Practices** with strong typing
✅ **RxJS Reactive Programming** for async operations
✅ **Component-Based Architecture** for maintainability
✅ **RESTful API Integration** with JSON Server

### Business Value
📊 **Admin Analytics**: Track user activity and recipe popularity
👥 **User Management**: Full control over user accounts
📅 **Meal Planning**: Help users organize weekly meals
⭐ **Social Features**: Favorites, ratings, sharing
🔐 **Security**: Protected user data and sessions
📱 **Cross-Platform**: Works on desktop and mobile
🎯 **User-Friendly**: Intuitive interface with clear feedback

### Academic Learning Objectives Met
1. **Frontend Framework**: Angular 21 mastery
2. **TypeScript**: Advanced type system usage
3. **HTTP Communication**: RESTful API integration
4. **Authentication**: Session management and security
5. **Authorization**: Role-based access control
6. **Routing**: Complex navigation with guards
7. **Forms**: Reactive forms with validation
8. **State Management**: Component and service-level state
9. **Error Handling**: Comprehensive error management
10. **Best Practices**: Clean code, SOLID principles

---

## 20. Presentation Flow Recommendation

### 15-Minute Presentation Structure

**1. Introduction (2 min)**
- Project overview
- Problem statement
- Solution approach

**2. Architecture Demo (3 min)**
- Show directory structure
- Explain service layer
- Demonstrate routing

**3. Live Demo (5 min)**
- Guest user experience
- User registration and login
- Recipe browsing and favorites
- Meal planning
- Admin dashboard

**4. Code Deep Dive (3 min)**
- Authentication service
- Route guards
- Optimistic updates

**5. Conclusion (2 min)**
- Key achievements
- Lessons learned
- Future enhancements
- Q&A

---

## 21. Common Interview Questions & Answers

### Q: Why Angular over React or Vue?
**A**: Angular provides:
- Complete framework (routing, forms, HTTP out of the box)
- Strong TypeScript integration
- Dependency injection
- Comprehensive CLI
- Enterprise-grade architecture

### Q: How do you handle state management?
**A**: 
- Component-level state for UI
- Service-level state for shared data
- BehaviorSubject for reactive updates
- Could scale to NgRx for complex apps

### Q: Explain your authentication flow
**A**:
1. User submits credentials
2. Service validates against JSON Server
3. Store user in localStorage
4. Set up session validation
5. Guards protect routes
6. Periodic validation checks
7. Logout clears session

### Q: How do you ensure security?
**A**:
- Route guards prevent unauthorized access
- Server-side validation on every navigation
- Session expiration handling
- Blocked user multi-layer checks
- Input validation
- Angular's built-in XSS protection

### Q: What's your approach to error handling?
**A**:
- Try-catch for async/await
- RxJS catchError for observables
- User-friendly error messages
- Fallback to mock data
- Loading states
- Retry mechanisms

---

## 22. Resources & Documentation

### Official Documentation
- Angular Docs: https://angular.dev
- RxJS Docs: https://rxjs.dev
- TypeScript Docs: https://www.typescriptlang.org

### Tools Used
- Angular CLI: v21.0.0
- JSON Server: Mock REST API
- Spoonacular API: Recipe data

### Development Tools
- VS Code with Angular extensions
- Chrome DevTools
- Angular DevTools extension
- Postman for API testing

---

## Summary

This Angular Meal Planner demonstrates:
- **Full-stack development** with modern Angular
- **Security best practices** with multi-layer authentication
- **User experience focus** with optimistic updates
- **Scalable architecture** with service-oriented design
- **Professional code quality** with TypeScript and best practices

The application successfully implements a complete meal planning system with user management, admin controls, and social features, showcasing advanced Angular concepts and real-world development practices.

---

**End of Presentation Guide**

*Generated for academic and presentation purposes*
*Angular Meal Planner - INFO 6150 Project*
