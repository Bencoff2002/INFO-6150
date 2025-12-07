import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-save-meal-plan-dialog',
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

                <h2 class="dialog-title">Save Meal Plan</h2>

                <div class="dialog-content">
                    <div class="form-group">
                        <label for="plan-name">Plan Name *</label>
                        <input 
                            type="text" 
                            id="plan-name"
                            [(ngModel)]="planName"
                            placeholder="e.g., January Week 1, Keto Week"
                            class="form-control"
                            (keypress)="onKeyPress($event)"
                        >
                    </div>

                    <div class="form-group">
                        <label for="plan-description">Description (optional)</label>
                        <textarea 
                            id="plan-description"
                            [(ngModel)]="planDescription"
                            placeholder="Add notes about this meal plan..."
                            class="form-control"
                            rows="3"
                        ></textarea>
                    </div>

                    <p class="info-text">
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        This will save all meals from your current week.
                    </p>
                </div>

                <div class="dialog-actions">
                    <button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
                    <button class="btn btn-primary" (click)="onSave()" [disabled]="!isValid()">
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                        </svg>
                        Save Plan
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

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: rgba(0, 0, 0, 0.87);
            font-size: 0.875rem;
        }

        .form-control {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid rgba(0, 0, 0, 0.23);
            border-radius: 4px;
            font-size: 0.875rem;
            font-family: inherit;
            transition: border-color 0.2s;
        }

        .form-control:focus {
            outline: none;
            border-color: #FF9F29;
            border-width: 2px;
            padding: 9px 11px;
        }

        textarea.form-control {
            resize: vertical;
        }

        .info-text {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.875rem;
            color: rgba(0, 0, 0, 0.6);
            margin: 16px 0 0 0;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 4px;
        }

        .info-text svg {
            fill: #FF9F29;
            flex-shrink: 0;
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

        /* Dark Theme Styles */
        :host-context(body.dark-theme) .dialog {
            background: var(--card-bg, #1e1e1e);
        }

        :host-context(body.dark-theme) .dialog-title,
        :host-context(body.dark-theme) .form-group label {
            color: var(--text-primary, #ffffff);
        }

        :host-context(body.dark-theme) .form-control {
            background: #2d2d2d;
            border-color: #444;
            color: var(--text-primary, #ffffff);
        }

        :host-context(body.dark-theme) .info-text {
            background: #2d2d2d;
            color: var(--text-secondary, #b0b0b0);
        }

        :host-context(body.dark-theme) .close-btn svg {
            fill: var(--text-secondary, #b0b0b0);
        }

        :host-context(body.dark-theme) .close-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        :host-context(body.dark-theme) .btn-primary {
            color: #000;
        }
    `]
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
