// src/app/core/models/registration.ts
export interface RegistrationRequestCreateDto {
  nombre: string;
  apellido: string;
  email: string;
  ocupacion?: string;
  zona?: string;
  direccion?: string;
  isDentist?: boolean;

}

export interface RegistrationRequestViewDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  ocupacion?: string;
  zona?: string;
  direccion?: string;
  status: 'PENDIENTE'|'APROBADA'|'RECHAZADA';
  createdAt: string;
}
