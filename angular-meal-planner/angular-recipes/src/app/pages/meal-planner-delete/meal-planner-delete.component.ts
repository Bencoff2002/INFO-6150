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
    template: `
        <div class="delete-container">
            <div class="delete-content">
                <div class="header">
                    <button class="back-btn" (click)="goBack()">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                        Back
                    </button>
                    <h1>Delete Meal Plan</h1>
                </div>

                <div *ngIf="alert" class="alert" [class.alert-success]="alert.type === 'success'" [class.alert-error]="alert.type === 'error'">
                    {{alert.message}}
                </div>

                <div *ngIf="loading" class="loading">
                    <div class="spinner"></div>
                    <p>Loading saved plans...</p>
                </div>

                <div *ngIf="!loading && savedPlans.length === 0" class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" height="64" viewBox="0 0 24 24" width="64">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                    </svg>
                    <h2>No Saved Plans</h2>
                    <p>You haven't saved any meal plans yet.</p>
                    <button class="btn btn-primary" (click)="goToCreate()">Create Your First Plan</button>
                </div>

                <div *ngIf="!loading && savedPlans.length > 0" class="plans-grid">
                    <div *ngFor="let plan of savedPlans" class="plan-card">
                        <div class="plan-header">
                            <h3>{{plan.name}}</h3>
                            <span class="meal-count">{{plan.meals.length}} meals</span>
                        </div>
                        <p *ngIf="plan.description" class="plan-description">{{plan.description}}</p>
                        <div class="plan-footer">
                            <span class="plan-date">Created: {{formatDate(plan.createdAt)}}</span>
                            <button class="btn btn-danger" (click)="confirmDelete(plan)">
                                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18">
                                    <path d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Dialog -->
            <div *ngIf="deleteConfirmPlan" class="dialog-overlay" (click)="cancelDelete()">
                <div class="dialog" (click)="$event.stopPropagation()">
                    <h2 class="dialog-title">Delete Meal Plan?</h2>
                    <p class="dialog-content">
                        Are you sure you want to delete "{{deleteConfirmPlan.name}}"? This action cannot be undone.
                    </p>
                    <div class="dialog-actions">
                        <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
                        <button class="btn btn-danger" (click)="deletePlan()">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .delete-container {
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
        }

        .delete-content {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 32px;
        }

        .back-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            color: rgba(0, 0, 0, 0.87);
            transition: all 0.2s;

            svg {
                fill: currentColor;
            }

            &:hover {
                background: #f5f5f5;
                border-color: #FF9F29;
                color: #FF9F29;
            }
        }

        .header h1 {
            font-size: 2rem;
            font-weight: 600;
            margin: 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .alert {
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 0.875rem;
            animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .loading {
            text-align: center;
            padding: 60px 20px;
        }

        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e0e0e0;
            border-top-color: #FF9F29;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .empty-state {
            text-align: center;
            padding: 80px 20px;

            svg {
                fill: rgba(0, 0, 0, 0.26);
                margin-bottom: 24px;
            }

            h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0 0 12px 0;
                color: rgba(0, 0, 0, 0.87);
            }

            p {
                font-size: 1rem;
                color: rgba(0, 0, 0, 0.6);
                margin: 0 0 24px 0;
            }
        }

        .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
        }

        .plan-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;

            &:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
        }

        .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .plan-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .meal-count {
            font-size: 0.75rem;
            background: #f5f5f5;
            padding: 4px 12px;
            border-radius: 12px;
            color: rgba(0, 0, 0, 0.6);
        }

        .plan-description {
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.6);
            margin: 0 0 16px 0;
            line-height: 1.5;
        }

        .plan-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 16px;
            border-top: 1px solid #f0f0f0;
        }

        .plan-date {
            font-size: 0.75rem;
            color: rgba(0, 0, 0, 0.4);
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;

            svg {
                fill: currentColor;
            }
        }

        .btn-primary {
            background: #FF9F29;
            color: white;
            box-shadow: 0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14);

            &:hover {
                background: #e68a1c;
                box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14);
            }
        }

        .btn-secondary {
            background: transparent;
            color: #FF9F29;

            &:hover {
                background: rgba(255, 159, 41, 0.04);
            }
        }

        .btn-danger {
            background: #d32f2f;
            color: white;
            box-shadow: 0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14);

            &:hover {
                background: #b71c1c;
                box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14);
            }
        }

        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .dialog {
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14);
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .dialog-title {
            font-size: 1.25rem;
            font-weight: 500;
            margin: 0 0 16px 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .dialog-content {
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.6);
            line-height: 1.5;
            margin-bottom: 24px;
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        @media (max-width: 768px) {
            .plans-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
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
