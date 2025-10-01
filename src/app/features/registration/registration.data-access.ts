// src/app/features/registration/registration.data-access.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegistrationRequestCreateDto, RegistrationRequestViewDto } from '../../core/models/registration';

@Injectable({ providedIn: 'root' })
export class RegistrationDataAccess {
  private http = inject(HttpClient);
  private base = '/api/registration';

  create(dto: RegistrationRequestCreateDto) {
    return this.http.post<{message: string}>(this.base, dto);
  }
}
