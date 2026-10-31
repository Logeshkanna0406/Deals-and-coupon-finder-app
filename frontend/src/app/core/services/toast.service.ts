import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000
    };

    this.toastsSignal.update(toasts => [...toasts, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }
  }

  success(message: string, title?: string): void {
    this.show({ type: 'success', message, title: title ?? 'Success' });
  }

  error(message: string, title?: string): void {
    this.show({ type: 'error', message, title: title ?? 'Error', duration: 5000 });
  }

  warning(message: string, title?: string): void {
    this.show({ type: 'warning', message, title: title ?? 'Warning' });
  }

  info(message: string, title?: string): void {
    this.show({ type: 'info', message, title: title ?? 'Information' });
  }

  remove(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSignal.set([]);
  }
}
