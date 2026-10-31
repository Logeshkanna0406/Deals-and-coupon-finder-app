import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop fade-in" (click)="cancel.emit()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close" (click)="cancel.emit()" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            @if (message) {
              <p style="margin: 0; line-height: 1.5; color: var(--text-main);">{{ message }}</p>
            }
            <ng-content></ng-content>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" [disabled]="isLoading" (click)="onCancel()">
              {{ cancelText || 'Cancel' }}
            </button>
            <button
              type="button"
              [class]="confirmButtonClass ? 'btn ' + confirmButtonClass : 'btn btn-' + (confirmVariant || 'primary')"
              [disabled]="isLoading"
              (click)="onConfirm()"
            >
              @if (isLoading) {
                <span>Processing...</span>
              } @else {
                {{ confirmText || 'Confirm' }}
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-dialog {
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--border);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .modal-close {
      font-size: 1.5rem;
      color: var(--text-muted);
      line-height: 1;
      cursor: pointer;
    }

    .modal-close:hover {
      color: var(--text-main);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
      background-color: var(--bg-main);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    }
  `]
})
export class ConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmation';
  @Input() message?: string;
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmVariant: 'primary' | 'danger' | 'accent' | 'success' = 'primary';
  @Input() confirmButtonClass?: string;
  @Input() isLoading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancel.emit();
    this.cancelled.emit();
  }
}
