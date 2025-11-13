import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RegistrationRequestsApi, RegistrationRequestView, Page, ApprovePayload} from './registration-requests.api';

@Component({
  selector: 'app-admin-solicitudes',
  standalone: true,
  imports: [CommonModule],               // ⬅️ necesario para *ngIf y *ngFor
  templateUrl: './admin-solicitudes.component.html',
})
export class AdminSolicitudesComponent {
  page?: Page<RegistrationRequestView>;
  loading = false;
  error?: string;

  constructor(private api: RegistrationRequestsApi) {}

  ngOnInit() { this.load(); }

  load(page = 0) {
    this.loading = true; this.error = undefined;
    this.api.listPending(page, 20).subscribe({
      next: p => { this.page = p; this.loading = false; },
      error: e => { this.error = e?.error?.message || 'Error cargando solicitudes'; this.loading = false; }
    });
  }

  approve(r: any) {
    const username = window.prompt(`Nombre de usuario para ${r.nombre} ${r.apellido}`, '');
    this.loading = true;
    this.api
      .approve(r.id, { username: username || undefined, roleName: 'ROLE_DENTIST' })
      .subscribe({
        next: () => { this.loading = false; this.load(this.page?.number || 0); },
        error: (e) => { this.loading = false; this.error = e?.error?.message || 'Error aprobando'; }
      });
  }

  reject(r: RegistrationRequestView) {
    const reason = prompt('Motivo del rechazo:', 'Datos incompletos');
    if (!reason) return;
    this.api.reject(r.id, reason).subscribe({
      next: () => { alert('Rechazado'); this.load(this.page?.number ?? 0); },
      error: e => alert(e?.error?.message || 'Error al rechazar')
    });
  }
}
