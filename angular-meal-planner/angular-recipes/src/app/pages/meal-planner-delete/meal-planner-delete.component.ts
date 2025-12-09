import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SavedMealPlan } from '../../models/meal-plan.model';
import { MealPlanService } from '../../services/meal-plan.service';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-meal-planner-delete',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './meal-planner-delete.component.html',
    styleUrls: ['./meal-planner-delete.component.scss']
})
export class MealPlannerDeleteComponent implements OnInit {
    savedPlans: SavedMealPlan[] = [];
    loading = true;
    user: any = null;
    deleteConfirmPlan: SavedMealPlan | null = null;
    alert: { type: 'success' | 'error', message: string } | null = null;

    constructor(
        private router: Router,
        private mealPlanService: MealPlanService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        // Get current user directly instead of subscribing
        const subscription = this.authService.user$.subscribe(user => {
            this.user = user;
        });
        subscription.unsubscribe();

        if (this.user) {
            await this.loadSavedPlans();
        } else {
            this.loading = false;
        }
    }

    async loadSavedPlans() {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            this.savedPlans = await this.mealPlanService.getSavedMealPlans(this.user.id);
        } catch (error) {
            console.error('Failed to load saved plans:', error);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    confirmDelete(plan: SavedMealPlan) {
        this.deleteConfirmPlan = plan;
    }

    cancelDelete() {
        this.deleteConfirmPlan = null;
    }

    async deletePlan() {
        if (!this.deleteConfirmPlan) return;

        try {
            await this.mealPlanService.deleteSavedMealPlan(this.deleteConfirmPlan.id);
            this.showAlert('success', `Deleted "${this.deleteConfirmPlan.name}" successfully`);
            this.deleteConfirmPlan = null;
            await this.loadSavedPlans();
        } catch (error) {
            console.error('Failed to delete plan:', error);
            this.showAlert('error', 'Failed to delete meal plan');
        }
    }

    showAlert(type: 'success' | 'error', message: string) {
        this.alert = { type, message };
        setTimeout(() => {
            this.alert = null;
            this.cdr.detectChanges();
        }, 3000);
    }

    goBack() {
        this.router.navigate(['/meal-planner']);
    }

    goToCreate() {
        this.router.navigate(['/meal-planner/create']);
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
