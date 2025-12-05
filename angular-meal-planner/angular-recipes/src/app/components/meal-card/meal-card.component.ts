import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealPlan } from '../../models/meal-plan.model';

@Component({
    selector: 'app-meal-card',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="meal-card" [class.empty]="!meal">
            <div *ngIf="meal; else emptyState" class="meal-content">
                <img [src]="meal.recipeImage || 'https://via.placeholder.com/300x140?text=No+Image'" 
                     [alt]="meal.recipeTitle" 
                     class="meal-image"
                     onerror="this.src='https://via.placeholder.com/300x140?text=No+Image'">
                <div class="meal-info">
                    <h4 class="meal-title">{{meal.recipeTitle}}</h4>
                    <span class="meal-source">{{getSourceLabel(meal.source)}}</span>
                    
                    <!-- Ingredients List -->
                    <div class="ingredients-section">
                        <div *ngIf="meal.ingredients && meal.ingredients.length > 0; else noIngredients">
                            <button class="ingredients-toggle" (click)="toggleIngredients($event)">
                                <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 24 24" width="14">
                                    <path d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M19 3H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"/>
                                </svg>
                                {{showIngredients ? 'Hide' : 'Show'}} ({{meal.ingredients.length}})
                            </button>
                            <ul *ngIf="showIngredients" class="ingredients-list">
                                <li *ngFor="let ingredient of meal.ingredients">{{ingredient}}</li>
                            </ul>
                        </div>
                        <ng-template #noIngredients>
                            <span class="no-ingredients">Ingredients not available</span>
                        </ng-template>
                    </div>
                </div>
                <div *ngIf="!isReadOnly" class="meal-actions">
                    <button class="action-btn edit-btn" (click)="onEdit()" title="Edit meal">
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" (click)="onDelete()" title="Delete meal">
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <ng-template #emptyState>
                <button *ngIf="!isReadOnly" class="add-meal-btn" (click)="onAdd()">
                    <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 0 24 24" width="32">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <span>Add {{mealType}}</span>
                </button>
                <div *ngIf="isReadOnly" class="empty-slot">
                    <span>No meal planned</span>
                </div>
            </ng-template>
        </div>
    `,
    styles: [`
        .meal-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: box-shadow 0.2s;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .meal-card:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .meal-card.empty {
            background: #fafafa;
            border: 2px dashed #e0e0e0;
        }

        .meal-content {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .meal-image {
            width: 100%;
            height: 140px;
            object-fit: cover;
            background: #f5f5f5;
            flex-shrink: 0;
        }

        .meal-info {
            padding: 12px;
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .meal-title {
            font-size: 0.875rem;
            font-weight: 600;
            margin: 0 0 4px 0;
            color: rgba(0, 0, 0, 0.87);
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            min-height: 2.6em;
        }

        .meal-source {
            font-size: 0.75rem;
            color: #666;
            font-style: italic;
        }

        .ingredients-section {
            margin-top: auto;
            padding-top: 8px;
            border-top: 1px solid #f0f0f0;
        }

        .ingredients-toggle {
            display: flex;
            align-items: center;
            gap: 4px;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 0.7rem;
            color: #FF9F29;
            padding: 4px 0;
            font-weight: 500;
            transition: opacity 0.2s;
            width: 100%;
            justify-content: flex-start;
        }

        .ingredients-toggle:hover {
            opacity: 0.8;
        }

        .ingredients-toggle svg {
            fill: currentColor;
            flex-shrink: 0;
        }

        .ingredients-list {
            list-style: none;
            padding: 6px 0 0 0;
            margin: 0;
            max-height: 90px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #FF9F29 #f5f5f5;
        }

        .ingredients-list::-webkit-scrollbar {
            width: 4px;
        }

        .ingredients-list::-webkit-scrollbar-track {
            background: #f5f5f5;
            border-radius: 4px;
        }

        .ingredients-list::-webkit-scrollbar-thumb {
            background: #FF9F29;
            border-radius: 4px;
        }

        .ingredients-list li {
            font-size: 0.7rem;
            color: #666;
            padding: 2px 0;
            line-height: 1.3;
        }

        .ingredients-list li:before {
            content: "• ";
            color: #FF9F29;
            font-weight: bold;
            margin-right: 4px;
        }

        .no-ingredients {
            font-size: 0.7rem;
            color: #999;
            font-style: italic;
            display: block;
            padding: 4px 0;
        }

        .meal-actions {
            display: flex;
            gap: 4px;
            padding: 4px 8px 8px;
            justify-content: flex-end;
        }

        .action-btn {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: none;
            background: rgba(0, 0, 0, 0.05);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: rgba(0, 0, 0, 0.1);
            transform: scale(1.1);
        }

        .edit-btn svg {
            fill: #FF9F29;
        }

        .delete-btn svg {
            fill: #d32f2f;
        }

        .add-meal-btn {
            width: 100%;
            height: 100%;
            min-height: 120px;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #999;
            transition: all 0.2s;
        }

        .add-meal-btn:hover {
            color: #FF9F29;
            background: rgba(255, 159, 41, 0.05);
        }

        .add-meal-btn svg {
            fill: currentColor;
        }

        .add-meal-btn span {
            font-size: 0.875rem;
            font-weight: 500;
        }

        .empty-slot {
            width: 100%;
            height: 100%;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ccc;
            font-size: 0.75rem;
            font-style: italic;
        }
    `]
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
