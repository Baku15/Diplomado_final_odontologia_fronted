// src/app/features/clinic/patients/attachment.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CurrentUserService } from './current-user.service';
import { AttachmentDto } from '../models/clinical-record.model';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private http = inject(HttpClient);
  private currentUser = inject(CurrentUserService);
  public apiBase = environment.apiBase;

  private async resolveClinicId(): Promise<number | null> {
    try {
      const cid = await this.currentUser.getClinicId();
      if (cid) return cid;
    } catch {
      // ignore
    }

    try {
      const me: any = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/me`).pipe(catchError(() => of(null)))
      );
      if (me && (me.clinicId || me.clinic_id)) return Number(me.clinicId ?? me.clinic_id);
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Presign request: backend returns { uploadUrl, storageKey, expiresIn }
   * El backend debe validar permisos y devolver la URL para PUT/POST hacia MinIO (u otro).
   */
  async generatePresign(
    patientId: number,
    filename: string,
    contentType?: string,
    sizeBytes?: number,
    clinicalRecordId?: number | null,
    procedureId?: number | null,
    toothReference?: string | null,
    type?: string | null,
    notes?: string | null
  ): Promise<{ uploadUrl: string; storageKey: string; expiresIn: number }> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/attachments/presign`;
    const body: any = {
      filename,
      contentType,
      size: sizeBytes,
      clinicalRecordId,
      procedureId,
      toothReference,
      type,
      notes,
    };
    return await lastValueFrom(this.http.post<any>(url, body));
  }

  /**
   * Link an already uploaded object to DB and return AttachmentDto
   * Body: { storageKey, filename, contentType, sizeBytes, clinicalRecordId?, procedureId?, toothReference?, notes?, type? }
   */
  async linkAttachment(patientId: number, payload: any): Promise<AttachmentDto> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/attachments/link`;
    return await lastValueFrom(this.http.post<AttachmentDto>(url, payload));
  }

  /**
   * List gallery (paged). Backend puede devolver Page<AttachmentDto>
   */
  async listGallery(patientId: number, page = 0, size = 50): Promise<{ content: AttachmentDto[]; totalElements?: number; page?: number; size?: number } | AttachmentDto[]> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/attachments/gallery?page=${page}&size=${size}`;
    return await lastValueFrom(this.http.get<any>(url));
  }

  /**
   * Get single attachment (with presigned urls)
   */
  async getAttachment(patientId: number, id: number, urlTtlSeconds = 300): Promise<AttachmentDto> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/attachments/${id}?urlTtlSeconds=${urlTtlSeconds}`;
    return await lastValueFrom(this.http.get<AttachmentDto>(url));
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(patientId: number, id: number): Promise<void> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');
    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/attachments/${id}`;
    await lastValueFrom(this.http.delete<void>(url));
  }

  /**
   * Convenience: perform PUT to presigned uploadUrl (browser fetch)
   * Returns void on success, throws on failure.
   * Note: this method does not call linkAttachment.
   */
  async uploadFileToPresignedUrl(uploadUrl: string, file: File, contentType?: string): Promise<void> {
    const headers: any = {};
    if (contentType) headers['Content-Type'] = contentType;
    try {
      const resp = await fetch(uploadUrl, {
        method: 'PUT',
        mode: 'cors',
        headers,
        body: file,
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.error('Presigned PUT failed', resp.status, resp.statusText, text);
        throw new Error(`Upload failed: ${resp.status} ${resp.statusText} ${text}`);
      }
    } catch (err) {
      console.error('Error performing presigned PUT', err);
      throw err;
    }
  }


  /**
   * Optionally: upload via multipart directly to backend endpoint (if tu backend soporta)
   */
  async uploadMultipart(patientId: number, file: File, clinicalRecordId?: number | null, toothReference?: string | null, type?: string | null, notes?: string | null, procedureId?: number | null): Promise<AttachmentDto> {
    const clinicId = await this.resolveClinicId();
    if (!clinicId) throw new Error('No clinicId found (token or /api/me).');

    const url = `${this.apiBase}/api/clinic/${clinicId}/patients/${patientId}/attachments`;
    const fd = new FormData();
    fd.append('file', file, file.name);
    if (clinicalRecordId != null) fd.append('clinicalRecordId', String(clinicalRecordId));
    if (procedureId != null) fd.append('procedureId', String(procedureId));
    if (toothReference) fd.append('toothReference', toothReference);
    if (type) fd.append('type', type);
    if (notes) fd.append('notes', notes);

    return await lastValueFrom(this.http.post<AttachmentDto>(url, fd));
  }
}
