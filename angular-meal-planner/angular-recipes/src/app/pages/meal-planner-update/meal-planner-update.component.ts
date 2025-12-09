import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SavedMealPlan } from '../../models/meal-plan.model';
import { MealPlanService } from '../../services/meal-plan.service';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-meal-planner-update',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './meal-planner-update.component.html',
    styleUrls: ['./meal-planner-update.component.scss']
})
export class MealPlannerUpdateComponent implements OnInit {
    savedPlans: SavedMealPlan[] = [];
    loading = true;
    user: any = null;

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

    updatePlan(plan: SavedMealPlan) {
        this.router.navigate(['/meal-planner/create'], {
            queryParams: {
                planId: plan.id,
                mode: 'edit'
            }
        });
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
