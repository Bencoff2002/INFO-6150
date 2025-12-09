import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-message-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './message-dialog.component.html',
    styleUrls: ['./message-dialog.component.scss']
})
export class MessageDialogComponent {
    @Input() title: string = 'Error';
    @Input() message: string = '';
    @Input() type: 'error' | 'info' | 'success' = 'error';
    @Output() close = new EventEmitter<void>();

    onClose() {
        this.close.emit();
    }
}
