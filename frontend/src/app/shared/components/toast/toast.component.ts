import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card toast-{{ toast.type }} fade-in">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <span>✓</span> }
              @case ('error') { <span>✕</span> }
              @case ('warning') { <span>⚠</span> }
              @case ('info') { <span>ℹ</span> }
            }
          </div>
          <div class="toast-body">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100% - 3rem);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-lg);
      background: var(--surface);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }

    .toast-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
    }

    .toast-success::before { background-color: var(--success); }
    .toast-error::before { background-color: var(--danger); }
    .toast-warning::before { background-color: var(--warning); }
    .toast-info::before { background-color: var(--secondary); }

    .toast-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .toast-success .toast-icon { background: var(--success-light); color: var(--success-dark); }
    .toast-error .toast-icon { background: var(--danger-light); color: var(--danger-dark); }
    .toast-warning .toast-icon { background: var(--warning-light); color: var(--warning); }
    .toast-info .toast-icon { background: var(--secondary-light); color: var(--secondary); }

    .toast-body {
      flex: 1;
    }

    .toast-title {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--text-main);
      margin-bottom: 0.125rem;
    }

    .toast-message {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.4;
      word-break: break-word;
    }

    .toast-close {
      font-size: 1.25rem;
      line-height: 1;
      color: var(--text-light);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.125rem;
      transition: color var(--transition-fast);
    }

    .toast-close:hover {
      color: var(--text-main);
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
