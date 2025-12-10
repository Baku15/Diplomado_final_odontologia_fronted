// src/app/features/patients/patient.model.ts
export interface IdentifierDto {
  system?: string;
  value?: string;
  type?: string;
}

export interface TelecomDto {
  system?: string; // "phone" | "email"
  value?: string;
  use?: string;    // "mobile" | "home" | "work"
  rank?: number;
}

export interface ContactDto {
  name?: string;
  relationship?: string;
  telecom?: string; // phone number
}

// ---------------------------------------------
// SUMMARY DTO — usado en LISTA y PAGINACIÓN
// ---------------------------------------------
export interface PatientSummary {
  id: number;
  givenName: string;
  familyName: string;
  fullName?: string;

  documentType?: string | null;
  documentNumber?: string | null;

  birthDate?: string | null;  // yyyy-mm-dd
  phoneMobile?: string | null;
  email?: string | null;

  createdAt?: string; // ISO Instant
}

// ---------------------------------------------
// DETAIL DTO — usado en VER / EDITAR
// ---------------------------------------------
export interface PatientDetail extends PatientSummary {
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postalCode?: string | null;
  addressLine?: string | null;
  country?: string | null;

  telecom?: TelecomDto[] | null;
  contacts?: ContactDto[] | null;

  photoUrl?: string | null;
}

// ---------------------------------------------
// CREATE REQUEST — usado en el Wizard de creación
// ---------------------------------------------
export interface PatientCreateRequest {
  givenName: string;
  familyName: string;

  documentType?: string | null;
  documentNumber?: string | null;

  identifiers?: IdentifierDto[] | null;

  birthDate?: string | null;
  sex?: string | null;

  phoneMobile?: string | null;
  phoneAlt?: string | null;
  email?: string | null;

  whatsappNumber?: string | null;
  whatsappSameAsMobile?: boolean | null;

  telecom?: TelecomDto[] | null;

  addressLine?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  contacts?: ContactDto[] | null;

  allowEmailReminders?: boolean | null;
  allowWhatsappReminders?: boolean | null;
}
