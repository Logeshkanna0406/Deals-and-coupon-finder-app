import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="empty-state-card fade-in">
      <div class="empty-icon">{{ icon || '🔍' }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description">{{ message || description }}</p>
      @if (actionLabel || actionText) {
        @if (actionLink) {
          <a [routerLink]="actionLink" class="btn btn-primary">
            {{ actionText || actionLabel }}
          </a>
        } @else {
          <button class="btn btn-primary" (click)="onAction()">
            {{ actionText || actionLabel }}
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .empty-state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3.5rem 1.5rem;
      background: var(--surface);
      border: 1px dashed var(--border);
      border-radius: var(--radius-xl);
      max-width: 520px;
      margin: 1.5rem auto;
    }

    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      line-height: 1;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    .empty-description {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      max-width: 400px;
      line-height: 1.5;
    }
  `]
})
export class EmptyStateComponent {
  @Input() title: string = 'No results found';
  @Input() description: string = 'We could not find anything matching your request.';
  @Input() message?: string;
  @Input() icon?: string;
  @Input() actionLabel?: string;
  @Input() actionText?: string;
  @Input() actionLink?: string;

  @Output() action = new EventEmitter<void>();
  @Output() actionClicked = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
    this.actionClicked.emit();
  }
}
