import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealPlan } from '../../models/meal-plan.model';

@Component({
    selector: 'app-meal-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './meal-card.component.html',
    styleUrls: ['./meal-card.component.scss']
})
export class MealCardComponent {
    @Input() meal: MealPlan | null = null;
    @Input() day: string = '';
    @Input() mealType: string = '';
    @Input() isReadOnly: boolean = false;

    @Output() edit = new EventEmitter<MealPlan>();
    @Output() delete = new EventEmitter<MealPlan>();
    @Output() add = new EventEmitter<{ day: string, mealType: string }>();

    showIngredients = false;

    onEdit() {
        if (this.meal && !this.isReadOnly) {
            this.edit.emit(this.meal);
        }
    }

    onDelete() {
        if (this.meal && !this.isReadOnly) {
            this.delete.emit(this.meal);
        }
    }

    onAdd() {
        if (!this.isReadOnly) {
            this.add.emit({ day: this.day, mealType: this.mealType });
        }
    }

    toggleIngredients(event: Event) {
        event.stopPropagation();
        this.showIngredients = !this.showIngredients;
    }

    getSourceLabel(source: string): string {
        switch (source) {
            case 'myRecipes': return 'My Recipe';
            case 'externalRecipes': return 'External Recipe';
            case 'favorites': return 'Favorite';
            default: return '';
        }
    }
}
