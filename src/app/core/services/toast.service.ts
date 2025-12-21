import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  success(message: string) {
    this.toastSubject.next({ type: 'success', message });
  }

  error(message: string) {
    this.toastSubject.next({ type: 'error', message });
  }

  warning(message: string) {
    this.toastSubject.next({ type: 'warning', message });
  }
}
