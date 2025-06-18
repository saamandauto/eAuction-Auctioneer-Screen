import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() contextInfo = ''; // Additional context information
  
  @Output() dialogConfirm = new EventEmitter<void>(); // Renamed from 'confirm'
  @Output() dialogCancel = new EventEmitter<void>(); // Renamed from 'cancel'

  onConfirm(): void {
    this.dialogConfirm.emit();
  }
  
  onCancel(): void {
    this.dialogCancel.emit();
  }
}