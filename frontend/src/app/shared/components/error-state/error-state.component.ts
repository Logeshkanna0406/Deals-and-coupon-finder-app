import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-state-card fade-in">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">{{ title }}</h3>
      <p class="error-message">{{ message }}</p>
      <button class="btn btn-secondary" (click)="retry.emit()">
        <span>↻</span> Try Again
      </button>
    </div>
  `,
  styles: [`
    .error-state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      background: var(--surface);
      border: 1px solid #fecaca;
      border-radius: var(--radius-lg);
      max-width: 480px;
      margin: 1.5rem auto;
    }

    .error-icon {
      font-size: 2.75rem;
      margin-bottom: 0.75rem;
    }

    .error-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--danger-dark);
      margin-bottom: 0.375rem;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }
  `]
})
export class ErrorStateComponent {
  @Input() title: string = 'Unable to load content';
  @Input() message: string = 'An error occurred while fetching data from the server. Please check your connection or retry.';
  @Output() retry = new EventEmitter<void>();
}
