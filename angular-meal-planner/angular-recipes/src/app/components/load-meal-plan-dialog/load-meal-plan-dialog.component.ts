import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedMealPlan } from '../../models/meal-plan.model';

@Component({
    selector: 'app-load-meal-plan-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './load-meal-plan-dialog.component.html',
    styleUrls: ['./load-meal-plan-dialog.component.scss']
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
