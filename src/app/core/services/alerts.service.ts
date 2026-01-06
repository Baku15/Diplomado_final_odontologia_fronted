import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // 🔔 estado interno
  private alertsSubject = new BehaviorSubject<SystemAlert[]>([]);
  private countSubject = new BehaviorSubject<number>(0);

  // 🌐 streams públicos
  alertsObservable$ = this.alertsSubject.asObservable();
  countObservable$ = this.countSubject.asObservable();

  // 🔧 URL base configurable
  private get baseUrl(): string {
    // En navegador: usa URL relativa
    // En servidor: usa URL absoluta
    return this.isBrowser ? '/api' : 'http://localhost:8080/api';
  }

  constructor() {
    // 🔄 Solo hacer polling en el navegador
    if (this.isBrowser) {
      // Polling cada 15s (puedes ajustar)
      interval(15000).subscribe(() => this.loadAlerts());
      this.loadAlerts();
    } else {
      // En SSR: inicializar con array vacío
      console.log('[SSR] AlertsService: Inicializando sin polling');
      this.alertsSubject.next([]);
      this.countSubject.next(0);
    }
  }

  // =========================
  // 📥 CARGAR ALERTAS
  // =========================
  loadAlerts(): void {
    // Verificar que estamos en navegador
    if (!this.isBrowser) {
      console.warn('[SSR] loadAlerts() llamado en servidor, ignorando...');
      return;
    }

    const url = `${this.baseUrl}/alerts`;

    this.http
      .get<SystemAlert[]>(url, {
        params: { clinicId: 1 } // 🔥 luego lo sacamos del /api/me
      })
      .subscribe({
        next: (alerts) => {
          // 🔴 CRITICAL arriba
          const ordered = [...alerts].sort((a, b) => {
            if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
            if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
            return 0;
          });

          this.alertsSubject.next(ordered);
          this.countSubject.next(ordered.length);
        },
        error: (error) => {
          console.error('Error cargando alertas:', error);
        }
      });
  }

  // =========================
  // ✅ RESOLVER ALERTA (OPTIMISTIC)
  // =========================
  resolveAlert(alertId: number): Observable<any> {
    // Verificar que estamos en navegador
    if (!this.isBrowser) {
      console.warn('[SSR] resolveAlert() llamado en servidor, retornando observable vacío');
      return of(null); // Retorna observable vacío en SSR
    }

    const url = `${this.baseUrl}/alerts/${alertId}/resolve`;

    // ⚡ 1. quitarla INMEDIATAMENTE del frontend
    const current = this.alertsSubject.getValue();
    const updated = current.filter(a => a.id !== alertId);

    this.alertsSubject.next(updated);
    this.countSubject.next(updated.length);

    // 🌐 2. avisar al backend (sin bloquear UI)
    return this.http
      .post(url, {})
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
