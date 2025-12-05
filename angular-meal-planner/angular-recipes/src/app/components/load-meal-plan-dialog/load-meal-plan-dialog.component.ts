import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedMealPlan } from '../../models/meal-plan.model';

@Component({
    selector: 'app-load-meal-plan-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="dialog-overlay" (click)="onCancel()">
            <div class="dialog" (click)="$event.stopPropagation()">
                <button class="close-btn" (click)="onCancel()">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>

                <h2 class="dialog-title">Load Saved Meal Plan</h2>

                <div class="dialog-content">
                    <div *ngIf="savedPlans.length === 0" class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                        </svg>
                        <p>No saved meal plans yet</p>
                        <p class="empty-hint">Save your current meal plan to reuse it later!</p>
                    </div>

                    <div *ngIf="savedPlans.length > 0" class="plans-list">
                        <div *ngFor="let plan of savedPlans" class="plan-card">
                            <div class="plan-header">
                                <h3 class="plan-name">{{plan.name}}</h3>
                                <span class="meal-count">{{plan.meals.length}} meals</span>
                            </div>
                            <p *ngIf="plan.description" class="plan-description">{{plan.description}}</p>
                            <p class="plan-date">Created: {{formatDate(plan.createdAt)}}</p>
                            <div class="plan-actions">
                                <button class="btn btn-primary" (click)="onLoad(plan)">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18">
                                        <path d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                                    </svg>
                                    Load
                                </button>
                                <button class="btn btn-danger" (click)="onDelete(plan)">
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

                <div class="dialog-actions">
                    <button class="btn btn-secondary" (click)="onCancel()">Close</button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <div *ngIf="deleteConfirmPlan" class="dialog-overlay" (click)="cancelDelete()">
            <div class="dialog small" (click)="$event.stopPropagation()">
                <h2 class="dialog-title">Delete Saved Plan?</h2>
                <p class="dialog-text">
                    Are you sure you want to delete "{{deleteConfirmPlan.name}}"? This action cannot be undone.
                </p>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
                    <button class="btn btn-danger" (click)="confirmDelete()">Delete</button>
                </div>
            </div>
        </div>

        <!-- Load Confirmation Dialog -->
        <div *ngIf="loadConfirmPlan" class="dialog-overlay" (click)="cancelLoad()">
            <div class="dialog small" (click)="$event.stopPropagation()">
                <h2 class="dialog-title">Load Meal Plan?</h2>
                <p class="dialog-text">
                    This will replace your current meal plan with "{{loadConfirmPlan.name}}". Continue?
                </p>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" (click)="cancelLoad()">Cancel</button>
                    <button class="btn btn-primary" (click)="confirmLoad()">Load Plan</button>
                </div>
            </div>
        </div>
    `,
    styles: [`
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
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14);
            animation: slideIn 0.3s ease-out;
            position: relative;
        }

        .dialog.small {
            max-width: 400px;
        }

        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .close-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }

        .close-btn:hover {
            background-color: rgba(0, 0, 0, 0.04);
        }

        .close-btn svg {
            fill: rgba(0, 0, 0, 0.54);
        }

        .dialog-title {
            font-size: 1.25rem;
            font-weight: 500;
            margin: 0 0 20px 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .dialog-text {
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.6);
            line-height: 1.5;
            margin: 0 0 20px 0;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: rgba(0, 0, 0, 0.6);
        }

        .empty-state svg {
            fill: rgba(0, 0, 0, 0.26);
            margin-bottom: 16px;
        }

        .empty-state p {
            margin: 8px 0;
        }

        .empty-hint {
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.4);
        }

        .plans-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .plan-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            transition: all 0.2s;
        }

        .plan-card:hover {
            border-color: #FF9F29;
            box-shadow: 0 2px 8px rgba(255, 159, 41, 0.1);
        }

        .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .plan-name {
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .meal-count {
            font-size: 0.75rem;
            background: #f5f5f5;
            padding: 4px 8px;
            border-radius: 12px;
            color: rgba(0, 0, 0, 0.6);
        }

        .plan-description {
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.6);
            margin: 0 0 8px 0;
        }

        .plan-date {
            font-size: 0.75rem;
            color: rgba(0, 0, 0, 0.4);
            margin: 0 0 12px 0;
        }

        .plan-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 20px;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn svg {
            fill: currentColor;
        }

        .btn-secondary {
            background: transparent;
            color: #FF9F29;
        }

        .btn-secondary:hover {
            background: rgba(255, 159, 41, 0.04);
        }

        .btn-primary {
            background: #FF9F29;
            color: white;
            box-shadow: 0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14);
        }

        .btn-primary:hover {
            background: #e68a1c;
            box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14);
        }

        .btn-danger {
            background: #d32f2f;
            color: white;
            box-shadow: 0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14);
        }

        .btn-danger:hover {
            background: #b71c1c;
            box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14);
        }
    `]
})
export class LoadMealPlanDialogComponent {
    @Input() savedPlans: SavedMealPlan[] = [];
    @Output() load = new EventEmitter<SavedMealPlan>();
    @Output() delete = new EventEmitter<SavedMealPlan>();
    @Output() cancel = new EventEmitter<void>();

    deleteConfirmPlan: SavedMealPlan | null = null;
    loadConfirmPlan: SavedMealPlan | null = null;

    onLoad(plan: SavedMealPlan) {
        this.loadConfirmPlan = plan;
    }

    confirmLoad() {
        if (this.loadConfirmPlan) {
            this.load.emit(this.loadConfirmPlan);
            this.loadConfirmPlan = null;
        }
    }

    cancelLoad() {
        this.loadConfirmPlan = null;
    }

    onDelete(plan: SavedMealPlan) {
        this.deleteConfirmPlan = plan;
    }

    confirmDelete() {
        if (this.deleteConfirmPlan) {
            this.delete.emit(this.deleteConfirmPlan);
            this.deleteConfirmPlan = null;
        }
    }

    cancelDelete() {
        this.deleteConfirmPlan = null;
    }

    onCancel() {
        this.cancel.emit();
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
