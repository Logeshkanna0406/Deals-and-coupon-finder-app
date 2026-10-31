import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (totalItems > 0) {
      <div class="pagination-container">
        <!-- Summary Info -->
        <div class="pagination-info">
          Showing <span class="info-highlight">{{ startItem }}</span> to
          <span class="info-highlight">{{ endItem }}</span> of
          <span class="info-highlight">{{ totalItems }}</span> entries
        </div>

        <!-- Controls -->
        <div class="pagination-controls">
          <!-- Page Size Selector -->
          @if (showPageSizeOptions) {
            <div class="page-size-selector">
              <label for="pageSizeSelect" class="size-label">Per page:</label>
              <select
                id="pageSizeSelect"
                class="size-select"
                [ngModel]="pageSize"
                (ngModelChange)="onPageSizeChange($event)"
              >
                @for (opt of pageSizeOptions; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </div>
          }

          <!-- Navigation Buttons -->
          <ul class="page-nav">
            <!-- First Page -->
            <li>
              <button
                type="button"
                class="page-btn nav-btn"
                [disabled]="currentPage === 1"
                (click)="goToPage(1)"
                title="First Page"
              >
                «
              </button>
            </li>

            <!-- Previous Page -->
            <li>
              <button
                type="button"
                class="page-btn nav-btn"
                [disabled]="currentPage === 1"
                (click)="goToPage(currentPage - 1)"
                title="Previous Page"
              >
                ‹
              </button>
            </li>

            <!-- Page Number Pills -->
            @for (p of visiblePages; track $index) {
              @if (p === -1) {
                <li class="ellipsis">…</li>
              } @else {
                <li>
                  <button
                    type="button"
                    class="page-btn"
                    [class.active]="p === currentPage"
                    (click)="goToPage(p)"
                  >
                    {{ p }}
                  </button>
                </li>
              }
            }

            <!-- Next Page -->
            <li>
              <button
                type="button"
                class="page-btn nav-btn"
                [disabled]="currentPage === totalPages"
                (click)="goToPage(currentPage + 1)"
                title="Next Page"
              >
                ›
              </button>
            </li>

            <!-- Last Page -->
            <li>
              <button
                type="button"
                class="page-btn nav-btn"
                [disabled]="currentPage === totalPages"
                (click)="goToPage(totalPages)"
                title="Last Page"
              >
                »
              </button>
            </li>
          </ul>
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.25rem 0.25rem 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      margin-top: 1rem;
    }
    .pagination-info {
      font-weight: 500;
    }
    .info-highlight {
      font-weight: 700;
      color: var(--text-main);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .size-label {
      color: var(--text-muted);
      font-size: 0.8125rem;
    }
    .size-select {
      padding: 0.3rem 0.6rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-main);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: border-color var(--transition-fast);
    }
    .size-select:focus {
      border-color: var(--primary);
    }
    .page-nav {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 0.3rem;
      align-items: center;
    }
    .page-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 0.45rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-main);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }
    .page-btn:hover:not(:disabled) {
      background: var(--surface-alt);
      border-color: var(--primary);
      color: var(--primary);
    }
    .page-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }
    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: var(--surface-alt);
    }
    .nav-btn {
      font-size: 0.9375rem;
      font-weight: 700;
    }
    .ellipsis {
      padding: 0 0.35rem;
      color: var(--text-muted);
      user-select: none;
    }
    @media (max-width: 640px) {
      .pagination-container {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .pagination-controls {
        justify-content: center;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() showPageSizeOptions = true;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    pages.push(1);
    if (current > 3) {
      pages.push(-1); // ellipsis
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push(-1); // ellipsis
    }
    pages.push(total);
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(newSize: number): void {
    const size = Number(newSize);
    if (size > 0 && size !== this.pageSize) {
      this.pageSizeChange.emit(size);
    }
  }
}
