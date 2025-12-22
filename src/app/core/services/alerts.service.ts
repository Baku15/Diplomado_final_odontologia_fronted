import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface SystemAlert {
  id: number;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {

  private http = inject(HttpClient);

  // 🔔 estado interno
  private alertsSubject = new BehaviorSubject<SystemAlert[]>([]);
  private countSubject = new BehaviorSubject<number>(0);

  // 🌐 streams públicos
  alertsObservable$ = this.alertsSubject.asObservable();
  countObservable$ = this.countSubject.asObservable();

  constructor() {
    // 🔄 polling cada 15s (puedes ajustar)
    interval(15000).subscribe(() => this.loadAlerts());
    this.loadAlerts();
  }

  // =========================
  // 📥 CARGAR ALERTAS
  // =========================
  loadAlerts() {
    this.http
      .get<SystemAlert[]>(`/api/alerts`, {
        params: { clinicId: 1 } // 🔥 luego lo sacamos del /api/me
      })
      .subscribe(alerts => {
        // 🔴 CRITICAL arriba
        const ordered = [...alerts].sort((a, b) => {
          if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
          if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
          return 0;
        });

        this.alertsSubject.next(ordered);
        this.countSubject.next(ordered.length);
      });
  }

  // =========================
  // ✅ RESOLVER ALERTA (OPTIMISTIC)
  // =========================
  resolveAlert(alertId: number) {

    // ⚡ 1. quitarla INMEDIATAMENTE del frontend
    const current = this.alertsSubject.getValue();
    const updated = current.filter(a => a.id !== alertId);

    this.alertsSubject.next(updated);
    this.countSubject.next(updated.length);

    // 🌐 2. avisar al backend (sin bloquear UI)
    return this.http
      .post(`/api/alerts/${alertId}/resolve`, {})
      .pipe(
        tap({
          error: () => {
            // ❌ si falla, re-sync completo
            this.loadAlerts();
          }
        })
      );
  }
}
