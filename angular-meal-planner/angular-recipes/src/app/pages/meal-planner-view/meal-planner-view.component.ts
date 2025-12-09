import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SavedMealPlan } from '../../models/meal-plan.model';
import { MealPlanService } from '../../services/meal-plan.service';
import { AuthService } from '../../services/auth.service';
import { RefreshService } from '../../services/refresh.service';
import { environment } from '../../../environments/environment';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-meal-planner-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './meal-planner-view.component.html',
    styleUrls: ['./meal-planner-view.component.scss']
})
export class MealPlannerViewComponent implements OnInit, OnDestroy {
    savedPlans: SavedMealPlan[] = [];
    loading = true;
    user: any = null;
    private refreshSubscription: Subscription | null = null;

    constructor(
        private router: Router,
        private mealPlanService: MealPlanService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef,
        private refreshService: RefreshService
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

        // Subscribe to refresh events
        this.refreshSubscription = this.refreshService.refresh$.subscribe(() => {
            console.log('[MealPlannerView] Refresh triggered');
            if (this.user) {
                this.loadSavedPlans();
            }
        });
    }

    ngOnDestroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
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

    viewPlan(plan: SavedMealPlan) {
        this.router.navigate(['/meal-planner/create'], {
            queryParams: {
                planId: plan.id,
                mode: 'view'
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
