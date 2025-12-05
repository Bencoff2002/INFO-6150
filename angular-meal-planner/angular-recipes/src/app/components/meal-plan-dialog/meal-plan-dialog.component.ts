import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealPlan } from '../../models/meal-plan.model';

@Component({
    selector: 'app-meal-plan-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="dialog-overlay" (click)="onCancel()">
            <div class="dialog" (click)="$event.stopPropagation()">
                <button class="close-btn" (click)="onCancel()">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>

                <h2 class="dialog-title">{{editingPlan ? 'Edit' : 'Add'}} {{mealType}} - {{day}}</h2>

                <div class="dialog-content">
                    <div class="form-group">
                        <label for="recipe-select">Select Recipe</label>
                        <select id="recipe-select" [(ngModel)]="selectedRecipeId" class="form-control">
                            <option value="">-- Choose a recipe --</option>
                            <option *ngFor="let recipe of availableRecipes" [value]="recipe.id || recipe.spoonacularId">
                                {{recipe.title}} ({{getRecipeSource(recipe)}})
                            </option>
                        </select>
                    </div>

                    <div *ngIf="selectedRecipe" class="recipe-preview">
                        <img [src]="selectedRecipe.image" [alt]="selectedRecipe.title" class="preview-image">
                        <div class="preview-info">
                            <h4>{{selectedRecipe.title}}</h4>
                            <p class="source-label">{{getRecipeSource(selectedRecipe)}}</p>
                        </div>
                    </div>
                </div>

                <div class="dialog-actions">
                    <button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
                    <button class="btn btn-primary" (click)="onSave()" [disabled]="!selectedRecipeId">
                        {{editingPlan ? 'Update' : 'Add'}}
                    </button>
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
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14);
            animation: slideIn 0.3s ease-out;
            position: relative;
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

        .dialog-content {
            margin-bottom: 24px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: rgba(0, 0, 0, 0.87);
        }

        .form-control {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid rgba(0, 0, 0, 0.23);
            border-radius: 4px;
            font-size: 0.875rem;
            transition: border-color 0.2s;
        }

        .form-control:focus {
            outline: none;
            border-color: #FF9F29;
            border-width: 2px;
            padding: 9px 11px;
        }

        .recipe-preview {
            margin-top: 16px;
            padding: 12px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .preview-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 4px;
        }

        .preview-info h4 {
            margin: 0 0 4px 0;
            font-size: 1rem;
            font-weight: 500;
        }

        .source-label {
            margin: 0;
            font-size: 0.75rem;
            color: #666;
            font-style: italic;
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
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

        .btn-primary:hover:not(:disabled) {
            background: #e68a1c;
            box-shadow: 0 2px 4px -1px rgba(0,0,0,0.2), 0 4px 5px 0 rgba(0,0,0,0.14);
        }

        .btn-primary:disabled {
            background: rgba(0, 0, 0, 0.12);
            color: rgba(0, 0, 0, 0.26);
            box-shadow: none;
            cursor: not-allowed;
        }
    `]
})
export class MealPlanDialogComponent implements OnInit {
    @Input() day: string = '';
    @Input() mealType: string = '';
    @Input() editingPlan: MealPlan | null = null;
    @Input() availableRecipes: any[] = [];

    @Output() save = new EventEmitter<Partial<MealPlan>>();
    @Output() cancel = new EventEmitter<void>();

    selectedRecipeId: string | number = '';
    selectedRecipe: any = null;

    ngOnInit() {
        if (this.editingPlan) {
            this.selectedRecipeId = this.editingPlan.recipeId;
            this.updateSelectedRecipe();
        }
    }

    ngOnChanges() {
        this.updateSelectedRecipe();
    }

    updateSelectedRecipe() {
        if (this.selectedRecipeId) {
            this.selectedRecipe = this.availableRecipes.find(
                r => (r.id || r.spoonacularId) == this.selectedRecipeId
            );
        } else {
            this.selectedRecipe = null;
        }
    }

    onSave() {
        if (!this.selectedRecipe) return;

        const mealPlan: Partial<MealPlan> = {
            day: this.day,
            mealType: this.mealType,
            recipeId: this.selectedRecipe.id || this.selectedRecipe.spoonacularId,
            recipeTitle: this.selectedRecipe.title,
            recipeImage: this.selectedRecipe.image,
            title: this.selectedRecipe.title,
            source: this.getRecipeSourceType(this.selectedRecipe)
        };

        if (this.editingPlan) {
            mealPlan.id = this.editingPlan.id;
        }

        this.save.emit(mealPlan);
    }

    onCancel() {
        this.cancel.emit();
    }

    getRecipeSource(recipe: any): string {
        if (recipe.userId) return 'My Recipe';
        if (recipe.source === 'favorites') return 'Favorite';
        return 'External Recipe';
    }

    getRecipeSourceType(recipe: any): 'myRecipes' | 'externalRecipes' | 'favorites' {
        if (recipe.userId) return 'myRecipes';
        if (recipe.source === 'favorites') return 'favorites';
        return 'externalRecipes';
    }
}
