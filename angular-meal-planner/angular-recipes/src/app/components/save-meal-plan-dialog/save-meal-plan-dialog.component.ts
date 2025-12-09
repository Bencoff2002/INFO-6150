import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-save-meal-plan-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './save-meal-plan-dialog.component.html',
    styleUrls: ['./save-meal-plan-dialog.component.scss']
})
export class SaveMealPlanDialogComponent {
    @Output() save = new EventEmitter<{ name: string, description: string }>();
    @Output() cancel = new EventEmitter<void>();

    planName = '';
    planDescription = '';

    isValid(): boolean {
        return this.planName.trim().length >= 3;
    }

    onSave() {
        if (this.isValid()) {
            this.save.emit({
                name: this.planName.trim(),
                description: this.planDescription.trim()
            });
        }
    }

    onCancel() {
        this.cancel.emit();
    }

    onKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter' && this.isValid()) {
            event.preventDefault();
            this.onSave();
        }
    }
}
