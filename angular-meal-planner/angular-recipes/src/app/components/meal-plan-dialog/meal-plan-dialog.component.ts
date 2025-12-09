import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealPlan } from '../../models/meal-plan.model';

@Component({
    selector: 'app-meal-plan-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './meal-plan-dialog.component.html',
    styleUrls: ['./meal-plan-dialog.component.scss']
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
