import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealPreferences } from '../../models/meal-plan.model';

@Component({
    selector: 'app-preferences-dialog',
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

                <h2 class="dialog-title">Meal Plan Preferences</h2>

                <div class="dialog-content">
                    <p class="description">
                        Customize your auto-generated meal plan based on your dietary preferences and restrictions.
                    </p>

                    <div class="form-section">
                        <h3>Dietary Preferences</h3>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" [(ngModel)]="localPreferences.isVegetarian">
                            <span>Vegetarian (exclude meat and fish)</span>
                        </label>

                        <label class="checkbox-label">
                            <input type="checkbox" [(ngModel)]="localPreferences.isWeightLoss">
                            <span>Weight Loss (exclude high-calorie foods)</span>
                        </label>

                        <label class="checkbox-label">
                            <input type="checkbox" [(ngModel)]="localPreferences.includeSnacks">
                            <span>Include Snacks (add daily snacks to meal plan)</span>
                        </label>
                    </div>

                    <div class="form-section">
                        <h3>Allergies & Restrictions</h3>
                        <p class="section-description">
                            Add ingredients or foods you want to avoid.
                        </p>

                        <div class="allergy-input-group">
                            <input 
                                type="text" 
                                [(ngModel)]="allergyInput"
                                (keypress)="onKeyPress($event)"
                                placeholder="e.g., nuts, dairy, gluten"
                                class="form-control"
                            >
                            <button 
                                class="btn btn-secondary" 
                                (click)="addAllergy()"
                                [disabled]="!allergyInput.trim()"
                            >
                                Add
                            </button>
                        </div>

                        <div *ngIf="localPreferences.allergies.length > 0" class="allergy-chips">
                            <div *ngFor="let allergy of localPreferences.allergies" class="chip">
                                {{allergy}}
                                <button class="chip-delete" (click)="removeAllergy(allergy)">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dialog-actions">
                    <button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
                    <button class="btn btn-primary" (click)="onGenerate()">Generate Meal Plan</button>
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
            margin: 0 0 16px 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .description {
            color: rgba(0, 0, 0, 0.6);
            font-size: 0.875rem;
            margin: 0 0 20px 0;
            line-height: 1.5;
        }

        .form-section {
            margin-bottom: 24px;
        }

        .form-section h3 {
            font-size: 1rem;
            font-weight: 500;
            margin: 0 0 12px 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .section-description {
            color: rgba(0, 0, 0, 0.6);
            font-size: 0.875rem;
            margin: 0 0 12px 0;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            cursor: pointer;
            font-size: 0.875rem;
        }

        .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .allergy-input-group {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }

        .form-control {
            flex: 1;
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

        .allergy-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            background: #FF9F29;
            color: white;
            border-radius: 16px;
            font-size: 0.875rem;
        }

        .chip-delete {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }

        .chip-delete:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .chip-delete svg {
            fill: white;
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 24px;
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

        .btn-secondary:hover:not(:disabled) {
            background: rgba(255, 159, 41, 0.04);
        }

        .btn-secondary:disabled {
            color: rgba(0, 0, 0, 0.26);
            cursor: not-allowed;
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
    `]
})
export class PreferencesDialogComponent {
    @Input() preferences: MealPreferences = {
        isVegetarian: false,
        isWeightLoss: false,
        allergies: [],
        includeSnacks: false
    };

    @Output() generate = new EventEmitter<MealPreferences>();
    @Output() cancel = new EventEmitter<void>();

    localPreferences: MealPreferences = {
        isVegetarian: false,
        isWeightLoss: false,
        allergies: [],
        includeSnacks: false
    };
    allergyInput: string = '';

    ngOnInit() {
        this.localPreferences = {
            ...this.preferences,
            allergies: [...this.preferences.allergies]
        };
    }

    addAllergy() {
        const allergy = this.allergyInput.trim();
        if (allergy && !this.localPreferences.allergies.includes(allergy)) {
            this.localPreferences.allergies.push(allergy);
            this.allergyInput = '';
        }
    }

    removeAllergy(allergy: string) {
        this.localPreferences.allergies = this.localPreferences.allergies.filter(a => a !== allergy);
    }

    onKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addAllergy();
        }
    }

    onGenerate() {
        this.generate.emit(this.localPreferences);
    }

    onCancel() {
        this.cancel.emit();
    }
}
