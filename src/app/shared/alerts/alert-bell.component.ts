import { Component, inject, HostListener } from '@angular/core';
import { CommonModule, NgIf, NgFor, AsyncPipe } from '@angular/common';
import { AlertsService } from '../../core/services/alerts.service';
import { map } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-alert-bell',
  imports: [CommonModule, NgIf, NgFor, AsyncPipe],
  template: `
    <div class="relative">
      <!-- 🔔 BOTÓN -->
      <button
        type="button"
        (click)="toggle($event)"
        class="relative inline-flex items-center justify-center
               h-9 w-9 rounded-full
               bg-white/20 hover:bg-white/30
               text-white transition"
      >
        🔔

        <!-- CONTADOR -->
        <span
          *ngIf="(count$ | async) as count"
          class="absolute -top-1 -right-1 bg-red-600 text-white
                 text-[10px] px-1.5 rounded-full"
        >
          {{ count }}
        </span>
      </button>

      <!-- PANEL -->
      <div
        *ngIf="open"
        class="absolute right-0 mt-2 w-80 bg-white text-slate-800
               rounded-xl shadow-lg border z-50"
      >
        <div class="px-3 py-2 font-semibold border-b">
          Notificaciones
        </div>

        <!-- LISTA -->
        <div
          *ngFor="let a of alerts$ | async"
          class="px-3 py-2 text-xs border-b last:border-b-0"
        >
          <div class="flex gap-2 items-start">
            <!-- ICONO -->
            <span class="text-lg">
              {{ iconForType(a.type) }}
            </span>

            <!-- CONTENIDO -->
            <div class="flex-1">
              <div [ngClass]="severityClass(a.severity)">
                {{ a.message }}
              </div>

              <div class="text-[10px] text-slate-400">
                {{ a.createdAt | date:'short' }}
              </div>
            </div>

            <!-- MARCAR -->
            <button
              class="text-[10px] text-sky-600"
              (click)="resolve(a.id, $event)"
            >
              Marcar
            </button>
          </div>
        </div>

        <!-- VACÍO -->
        <div
          *ngIf="(count$ | async) === 0"
          class="px-3 py-4 text-center text-xs text-slate-400"
        >
          No hay notificaciones pendientes
        </div>
      </div>
    </div>
  `,
})
export class AlertBellComponent {

  private alertsService = inject(AlertsService);

  // 🔥 ALERTAS ORDENADAS (CRITICAL ARRIBA)
  alerts$ = this.alertsService.alertsObservable$.pipe(
    map(alerts =>
      [...alerts].sort((a, b) => {
        if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
        if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
        return 0;
      })
    )
  );

  count$ = this.alertsService.countObservable$;

  open = false;
  private autoCloseTimer?: any;

  // 🔔 abrir / cerrar panel
  toggle(event: MouseEvent) {
    event.stopPropagation();
    this.open = !this.open;

    if (this.open) {
      this.startAutoClose();
    }
  }

  // ⏱️ auto-cierre después de 8 segundos
  private startAutoClose() {
    clearTimeout(this.autoCloseTimer);
    this.autoCloseTimer = setTimeout(() => {
      this.open = false;
    }, 8000);
  }

  // ❌ cerrar al hacer click fuera
  @HostListener('document:click')
  closeOnOutsideClick() {
    this.open = false;
  }

  // ✔️ marcar alerta (desaparece)
  resolve(id: number, event: MouseEvent) {
    event.stopPropagation();

    this.alertsService.resolveAlert(id).subscribe(() => {
      // se actualiza solo por observable
    });
  }

  // 🎨 color por severidad
  severityClass(sev: string) {
    return {
      'text-red-600': sev === 'CRITICAL',
      'text-amber-600': sev === 'WARNING',
      'text-sky-700': sev === 'INFO',
    };
  }

  // 🔔 icono por tipo
  iconForType(type: string): string {
    switch (type) {
      case 'APPOINTMENT':
        return '📅';
      case 'PATIENT':
        return '🚫';
      case 'CONSULTATION':
        return '🦷';
      case 'SYSTEM':
        return '⚙️';
      default:
        return 'ℹ️';
    }
  }
}
