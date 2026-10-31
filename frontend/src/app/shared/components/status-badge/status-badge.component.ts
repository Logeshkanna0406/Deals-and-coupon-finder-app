import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="'badge badge-' + (status ? status.toLowerCase() : 'secondary')">
      {{ displayStatus }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: string = '';

  get displayStatus(): string {
    if (!this.status) return '';
    return this.status.replace(/_/g, ' ');
  }
}
