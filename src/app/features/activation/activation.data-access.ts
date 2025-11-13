import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ActivationDataAccess {
  private http = inject(HttpClient);
  private base = '/api/auth';

  activate(token: string, newPassword: string) {
    // POST /api/auth/activate/{token} con { newPassword }
    return this.http.post<{ message: string; success: boolean }>(
      `${this.base}/activate/${encodeURIComponent(token)}`,
      { newPassword }
    );
  }
}
