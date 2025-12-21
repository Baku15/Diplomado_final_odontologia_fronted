import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-toast',
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999]" *ngIf="visible">
      <div
        class="px-4 py-3 rounded-lg shadow-lg text-sm text-white"
        [ngClass]="type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'"
      >
        <div class="font-semibold">{{ title }}</div>
        <div class="opacity-90">{{ message }}</div>
      </div>
    </div>
  `
})
export class ToastComponent {
  visible = false;
  title = '';
  message = '';
  type: 'success' | 'error' = 'success';

  show(
    type: 'success' | 'error',
    title: string,
    message: string
  ) {
    this.type = type;
    this.title = title;
    this.message = message;
    this.visible = true;

    setTimeout(() => {
      this.visible = false;
    }, 3000);
  }
}
