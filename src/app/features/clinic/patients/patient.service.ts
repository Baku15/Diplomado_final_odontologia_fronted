import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PatientCreateRequest } from './patient.model';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);
  private currentUser = inject(CurrentUserService);
  private apiBase = environment.apiBase;

  // cache en memoria del clinicId para no recalcular todo el tiempo
  private cachedClinicId: number | null | undefined;

  /**
   * Resuelve clinicId desde el token (CurrentUserService)
   * o, si falla, desde /api/me.
   */
  private async resolveClinicId(): Promise<number | null> {
    if (this.cachedClinicId !== undefined) {
      return this.cachedClinicId;
    }

    try {
      const cid = await this.currentUser.getClinicId();
      if (cid) {
        this.cachedClinicId = cid;
        return cid;
      }
    } catch (e) {
      // ignore y probar /api/me
    }

    try {
      const me: any = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/me`).pipe(catchError(() => of(null)))
      );
      if (me && me.clinicId) {
        const cid = Number(me.clinicId);
        this.cachedClinicId = cid;
        return cid;
      }
    } catch (e) {
      // ignore
    }

    this.cachedClinicId = null;
    return null;
  }

  /** Expuesto para que los componentes puedan construir URLs (lista / detalle). */
  async getClinicIdForRoutes(): Promise<number | null> {
    return this.resolveClinicId();
  }

  /** Expuesto para construir URLs absolutas al backend. */
  get apiBaseUrl(): string {
    return this.apiBase;
  }

  /**
   * Crear paciente (JSON simple).
   * Devuelve PatientDetailDto desde backend.
   */
  async createPatient(payload: PatientCreateRequest): Promise<any> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients`;
    return lastValueFrom(this.http.post(url, payload));
  }

  /**
   * Crear paciente con foto (multipart).
   * Envío: 'payload' = JSON string, 'photo' = archivo.
   */
  async createPatientWithPhoto(payload: PatientCreateRequest, photo: File): Promise<any> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients`;

    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    fd.append('photo', photo, photo.name);

    const evt: any = await lastValueFrom(
      this.http.post(url, fd, {
        reportProgress: true,
        observe: 'events',
      })
    );

    if (evt && evt.type === HttpEventType.Response) {
      return evt.body;
    }
    return evt;
  }

  /**
   * Subir/actualizar foto de un paciente existente.
   */
  async uploadPatientPhoto(patientId: number, file: File): Promise<any> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/photo`;

    const fd = new FormData();
    fd.append('file', file, file.name);

    const event: any = await lastValueFrom(
      this.http.post(url, fd, {
        reportProgress: true,
        observe: 'events',
      })
    );

    if (event && event.type === HttpEventType.Response) {
      return event.body;
    }
    return event;
  }

  /**
   * Lista de pacientes.
   * Puede devolver un array simple o una respuesta paginada según backend.
   */
  async listPatients(): Promise<any> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients`;
    return lastValueFrom(this.http.get<any>(url));
  }

  /**
   * Obtener detalle de un paciente por ID.
   */
  async getPatient(patientId: number): Promise<any> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}`;
    return lastValueFrom(this.http.get<any>(url));
  }

  /**
   * Actualizar paciente (editar datos).
   * Se espera que payload sea compatible con PatientUpdateRequest en el backend.
   */
  async updatePatient(patientId: number, payload: any): Promise<any> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}`;
    return lastValueFrom(this.http.put<any>(url, payload));
  }

  /**
   * Eliminar paciente (DELETE).
   */
  async deletePatient(patientId: number): Promise<void> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}`;
    await lastValueFrom(this.http.delete<void>(url));
  }

  /**
   * Verificación de duplicados antes de crear paciente.
   */
  async checkDuplicate(checkBody: any): Promise<any | null> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) {
      // no se puede verificar, el caller debe confiar en la validación del backend
      return null;
    }
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/check-duplicate`;

    try {
      const resp = await lastValueFrom(
        this.http.post<any>(url, checkBody).pipe(catchError(() => of(null)))
      );
      return resp;
    } catch (e) {
      return null;
    }
  }
}
