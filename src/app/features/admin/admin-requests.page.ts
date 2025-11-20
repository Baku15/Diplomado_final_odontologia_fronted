import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import {AuthService} from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface RegistrationRequestView {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ocupacion?: string;
  zona?: string;
  direccion?: string;
  createdAt?: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVATED';
}

@Component({
  standalone: true,
  selector: 'app-admin-requests-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="border-b bg-white">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-slate-900">Solicitudes de registro</h1>
            <p class="text-sm text-slate-500">
              Revisa las solicitudes pendientes y aprueba o rechaza el acceso de nuevos odontólogos.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              (click)="reload()"
            >
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              Actualizar
            </button>

            <button
              type="button"
              class="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              (click)="logout()"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>


      <!-- Contenido -->
      <main class="max-w-6xl mx-auto px-4 py-6">
        <!-- Estado vacío -->
        <div
          *ngIf="!loading && requests.length === 0"
          class="border border-dashed border-slate-300 rounded-xl bg-white p-8 text-center"
        >
          <h2 class="text-slate-700 font-semibold mb-1">No hay solicitudes pendientes</h2>
          <p class="text-sm text-slate-500 mb-2">
            Cuando alguien se registre, verás la solicitud aquí para revisarla.
          </p>
        </div>

        <!-- Tabla -->
        <div
          *ngIf="requests.length > 0"
          class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Odontólogo
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Email
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Zona
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Fecha
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr *ngFor="let r of requests">
                <td class="px-4 py-3">
                  <div class="text-sm font-medium text-slate-900">
                    {{ r.nombre }} {{ r.apellido }}
                  </div>
                  <div class="text-xs text-slate-500">
                    {{ r.ocupacion || 'Odontólogo' }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">
                  {{ r.email }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ r.zona || '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">
                  {{ r.createdAt ? (r.createdAt | date: 'short') : '—' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-2">
                    <button
                      class="inline-flex items-center rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      (click)="openReject(r)"
                    >
                      Rechazar
                    </button>
                    <button
                      class="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm"
                      (click)="openApprove(r)"
                    >
                      Aprobar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="mt-4 text-sm text-slate-500">
          Cargando solicitudes...
        </div>
      </main>

      <!-- MODAL APROBAR -->
      <div
        *ngIf="showApproveModal && selected"
        class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">
              Aprobar solicitud
            </h2>
            <button
              class="p-1 rounded-full hover:bg-slate-100"
              (click)="closeApprove()"
            >
              <span class="sr-only">Cerrar</span>
              ✕
            </button>
          </div>

          <div class="px-6 py-4 space-y-3">
            <p class="text-sm text-slate-600">
              Estás a punto de aprobar el acceso para:
            </p>

            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="text-sm font-semibold text-slate-900">
                {{ selected.nombre }} {{ selected.apellido }}
              </div>
              <div class="text-xs text-slate-500">
                {{ selected.email }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                {{ selected.zona || 'Zona no especificada' }} ·
                {{ selected.direccion || 'Sin dirección' }}
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-medium text-slate-600">
                Nombre de usuario sugerido (opcional)
              </label>
              <input
                type="text"
                [(ngModel)]="approveUsername"
                class="mt-0 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Déjalo vacío para generar uno automáticamente"
              />
              <p class="text-[11px] text-slate-500">
                Si lo dejas vacío, el sistema generará un usuario basado en el nombre y apellido.
              </p>
            </div>

            <div class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex gap-2">
              <span class="mt-0.5">⚠️</span>
              <p>
                Se creará la cuenta en estado
                <strong>PENDIENTE DE ACTIVACIÓN</strong> y se enviará un correo con el enlace
                para que el odontólogo defina su contraseña.
              </p>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              (click)="closeApprove()"
            >
              Cancelar
            </button>
            <button
              class="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              [disabled]="saving"
              (click)="confirmApprove()"
            >
              {{ saving ? 'Guardando...' : 'Confirmar aprobación' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL RECHAZAR -->
      <div
        *ngIf="showRejectModal && selected"
        class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">
              Rechazar solicitud
            </h2>
            <button
              class="p-1 rounded-full hover:bg-slate-100"
              (click)="closeReject()"
            >
              ✕
            </button>
          </div>

          <div class="px-6 py-4 space-y-3">
            <p class="text-sm text-slate-600">
              Indica brevemente el motivo del rechazo. (Opcional, pero recomendado para el registro interno.)
            </p>
            <textarea
              [(ngModel)]="rejectReason"
              rows="3"
              class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Ej: Datos incompletos, email no válido, etc."
            ></textarea>
          </div>

          <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              (click)="closeReject()"
            >
              Cancelar
            </button>
            <button
              class="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              [disabled]="saving"
              (click)="confirmReject()"
            >
              {{ saving ? 'Guardando...' : 'Confirmar rechazo' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminRequestsPage implements OnInit {
  requests: RegistrationRequestView[] = [];
  loading = false;
  saving = false;

  selected: RegistrationRequestView | null = null;
  showApproveModal = false;
  showRejectModal = false;

  approveUsername: string | null = null;
  rejectReason = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService) {
  }

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;

    const params = new HttpParams()
      .set('page', '0')
      .set('size', '20');

    const url = `${environment.apiBase}/api/admin/registration-requests/pending`;

    this.http
      .get<{ content: RegistrationRequestView[] }>(url, {params})
      .subscribe({
        next: (res) => {
          this.requests = res.content ?? [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar solicitudes', err);
          this.loading = false;
        },
      });
  }

  openApprove(r: RegistrationRequestView) {
    this.selected = r;
    this.approveUsername = null;
    this.showApproveModal = true;
  }

  closeApprove() {
    this.showApproveModal = false;
    this.selected = null;
    this.approveUsername = null;
  }


  confirmApprove() {
    if (!this.selected) return;
    this.saving = true;

    const body = {
      username: this.approveUsername || null,
    };

    const url = `${environment.apiBase}/api/admin/registration-requests/${this.selected.id}/approve`;

    this.http
      .post<void>(url, body)
      .subscribe({
        next: () => {
          this.saving = false;
          this.closeApprove();
          this.reload();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error al aprobar solicitud', err);
        },
      });
  }

  logout() {
    this.auth.logout();
  }

  openReject(r: RegistrationRequestView) {
    this.selected = r;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeReject() {
    this.showRejectModal = false;
    this.selected = null;
    this.rejectReason = '';
  }

  confirmReject() {
    if (!this.selected) return;
    this.saving = true;

    const body = {
      reason: this.rejectReason || '',
    };

    const url = `${environment.apiBase}/api/admin/registration-requests/${this.selected.id}/reject`;

    this.http
      .post<void>(url, body)
      .subscribe({
        next: () => {
          this.saving = false;
          this.closeReject();
          this.reload();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error al rechazar solicitud', err);
        },
      });
  }
}
