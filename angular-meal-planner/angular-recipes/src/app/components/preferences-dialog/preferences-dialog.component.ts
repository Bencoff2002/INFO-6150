import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealPreferences } from '../../models/meal-plan.model';

@Component({
    selector: 'app-preferences-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './preferences-dialog.component.html',
    styleUrls: ['./preferences-dialog.component.scss']
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
