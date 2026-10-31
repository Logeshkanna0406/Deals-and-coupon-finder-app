import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('card') {
        <div class="skeleton-grid">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="skeleton-card">
              <div class="skeleton" style="height: 140px; border-radius: 12px 12px 0 0;"></div>
              <div style="padding: 1.25rem;">
                <div class="skeleton" style="height: 20px; width: 60%; margin-bottom: 0.75rem;"></div>
                <div class="skeleton" style="height: 16px; width: 90%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton" style="height: 16px; width: 40%; margin-bottom: 1.25rem;"></div>
                <div class="skeleton" style="height: 38px; border-radius: 8px;"></div>
              </div>
            </div>
          }
        </div>
      }
      @case ('table') {
        <div class="skeleton-table">
          @for (row of [1, 2, 3, 4, 5]; track row) {
            <div class="skeleton-row">
              <div class="skeleton" style="height: 20px; width: 25%;"></div>
              <div class="skeleton" style="height: 20px; width: 30%;"></div>
              <div class="skeleton" style="height: 20px; width: 15%;"></div>
              <div class="skeleton" style="height: 20px; width: 15%;"></div>
            </div>
          }
        </div>
      }
      @case ('metric') {
        <div class="skeleton-metric-grid">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="skeleton-card" style="padding: 1.25rem;">
              <div class="skeleton" style="height: 16px; width: 50%; margin-bottom: 0.75rem;"></div>
              <div class="skeleton" style="height: 32px; width: 70%;"></div>
            </div>
          }
        </div>
      }
      @default {
        <div class="skeleton" [style.height]="height || '20px'" [style.width]="width || '100%'"></div>
      }
    }
  `,
  styles: [`
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      width: 100%;
    }

    .skeleton-metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
      width: 100%;
    }

    .skeleton-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .skeleton-table {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
  `]
})
export class LoadingSkeletonComponent {
  @Input() type: 'card' | 'table' | 'metric' | 'text' = 'text';
  @Input() height?: string;
  @Input() width?: string;
}
