// src/app/features/registration/registration.data-access.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegistrationRequestCreateDto } from '../../core/models/registration';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RegistrationDataAccess {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/api/public/registration/dentist`;

  constructor() {
    console.log('[RegistrationDataAccess] base =', this.base); // 👀 debe mostrar http://localhost:8080/api/registration
  }

  create(dto: RegistrationRequestCreateDto) {
    return this.http.post<{ message: string }>(this.base, dto);
  }
}
