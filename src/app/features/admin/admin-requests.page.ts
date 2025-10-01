// src/app/features/admin/admin-requests.page.ts
import { Component, inject } from '@angular/core';
import { AdminDataAccess } from './admin.data-access';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-admin-requests',
  imports: [NgFor, AsyncPipe, MatButtonModule],
  template: `
    <h1>Solicitudes pendientes</h1>
    <div *ngFor="let r of list">
      <strong>{{ r.nombre }} {{ r.apellido }}</strong> — {{ r.email }} — {{ r.status }}
      <button mat-button color="primary" (click)="approve(r.id)">Aprobar</button>
      <button mat-button color="warn" (click)="reject(r.id)">Rechazar</button>
    </div>
  `
})
export class AdminRequestsPage {
  private api = inject(AdminDataAccess);
  list: any[] = [];

  ngOnInit() {
    this.api.listPending().subscribe(res => this.list = res.content);
  }

  approve(id: number) {
    this.api.approve(id, { roleName: 'ROLE_PATIENT', sendTempPassword: true }).subscribe(() => {
      this.list = this.list.filter(x => x.id !== id);
    });
  }

  reject(id: number) {
    this.api.reject(id).subscribe(() => {
      this.list = this.list.filter(x => x.id !== id);
    });
  }
}
