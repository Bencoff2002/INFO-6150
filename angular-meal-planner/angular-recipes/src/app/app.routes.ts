
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RecipeDetailComponent } from './pages/recipe-detail/recipe-detail.component';
import { TopRatedComponent } from './pages/top-rated/top-rated.component';
import { FavouritesComponent } from './pages/favourites/favourites.component';
import { MyRecipeBookComponent } from './pages/my-recipe-book/my-recipe-book.component';
import { SharedRecipesComponent } from './pages/shared-recipes/shared-recipes.component';
import { EditProfileComponent } from './pages/edit-profile/edit-profile.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { MealPlannerLandingComponent } from './pages/meal-planner-landing/meal-planner-landing.component';
import { MealPlannerComponent } from './pages/meal-planner/meal-planner.component';
import { MealPlannerViewComponent } from './pages/meal-planner-view/meal-planner-view.component';
import { MealPlannerUpdateComponent } from './pages/meal-planner-update/meal-planner-update.component';
import { MealPlannerDeleteComponent } from './pages/meal-planner-delete/meal-planner-delete.component';
import { AdminStatisticsComponent } from './pages/admin-statistics/admin-statistics.component';
import { AdminReportsComponent } from './pages/admin-reports/admin-reports.component';
import { HighestRatedReportComponent } from './pages/highest-rated-report/highest-rated-report.component';
import { ViewedRecipesReportComponent } from './pages/viewed-recipes-report/viewed-recipes-report.component';
import { UserActivityReportComponent } from './pages/user-activity-report/user-activity-report.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { userGuard } from './guards/user.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'shared/:id', component: RecipeDetailComponent },
    { path: 'home', component: HomeComponent, canActivate: [userGuard] },
    { path: 'recipe/:id', component: RecipeDetailComponent, canActivate: [userGuard] },
    { path: 'my-recipes', component: MyRecipeBookComponent, canActivate: [userGuard] },
    { path: 'my-recipes/:id', component: RecipeDetailComponent, data: { isCustomRecipe: true }, canActivate: [userGuard] },
    { path: 'shared-recipes', component: SharedRecipesComponent, canActivate: [userGuard] },
    { path: 'top-rated', component: TopRatedComponent, canActivate: [userGuard] },
    { path: 'favorites', component: FavouritesComponent, canActivate: [userGuard] },
    { path: 'meal-planner', component: MealPlannerLandingComponent, canActivate: [userGuard] },
    { path: 'meal-planner/create', component: MealPlannerComponent, canActivate: [userGuard] },
    { path: 'meal-planner/view', component: MealPlannerViewComponent, canActivate: [userGuard] },
    { path: 'meal-planner/update', component: MealPlannerUpdateComponent, canActivate: [userGuard] },
    { path: 'meal-planner/delete', component: MealPlannerDeleteComponent, canActivate: [userGuard] },
    { path: 'edit-profile', component: EditProfileComponent, canActivate: [authGuard] },
    { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
    { path: 'admin/statistics', component: AdminStatisticsComponent, canActivate: [authGuard, adminGuard] },
    { path: 'admin/reports', component: AdminReportsComponent, canActivate: [authGuard, adminGuard] },
    { path: 'admin/reports/rated', component: HighestRatedReportComponent, canActivate: [authGuard, adminGuard] },
    { path: 'admin/reports/viewed', component: ViewedRecipesReportComponent, canActivate: [authGuard, adminGuard] },
    { path: 'admin/reports/user-activity', component: UserActivityReportComponent, canActivate: [authGuard, adminGuard] },
    { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard, adminGuard] },
    { path: '**', redirectTo: '' }
];
