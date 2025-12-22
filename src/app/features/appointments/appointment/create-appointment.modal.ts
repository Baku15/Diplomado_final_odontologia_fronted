import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { Appointment } from '../../../core/models/appointment.model';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-create-appointment-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-appointment.modal.html',
  styleUrls: ['./create-appointment.modal.scss']
})
export class CreateAppointmentModal implements OnInit {

  // =========================
  // INPUTS
  // =========================
  @Input() clinicId!: number;
  @Input() patientId?: number;
  @Input() doctorId!: number;
  @Input() consultationId?: number;

  // 👉 SOLO EN MODO EDICIÓN
  @Input() appointment?: Appointment;
  @Input() editMode = false;

  @Input() date!: string;       // YYYY-MM-DD
  @Input() startTime!: string;  // HH:mm

  @Output() close = new EventEmitter<boolean>();

  // =========================
  // CONFIG
  // =========================
  readonly STEP_MINUTES = 30;
  readonly minDuration = 30;
  readonly maxDuration = 240; // 4 horas

  // =========================
  // FORM STATE
  // =========================
  patientEmail?: string;
  canSendEmail = false;
  loadingEmail = false;
  durationMinutes = 30;
  reason = '';

  sendEmail = false;
  reminderMinutesBefore = 2880;

  saving = false;
  error?: string;

  constructor(
    private appointmentsService: AppointmentsService,
  private router: Router

) {}

  // =========================
  // INIT (MODO EDICIÓN)
  // =========================
  ngOnInit(): void {

    // 👉 cargar email SIEMPRE que exista patientId
    if (this.patientId) {
      this.loadPatientEmail();
    }

    // 👉 modo edición
    if (this.editMode && this.appointment) {
      this.durationMinutes = this.appointment.durationMinutes;
      this.reason = this.appointment.reason || '';
      this.sendEmail = !!this.appointment.sendEmail;
      this.reminderMinutesBefore =
        this.appointment.reminderMinutesBefore ?? 2880;
    }
  }


  // =========================
  // HELPERS
  // =========================
  get endTime(): string {
    const [h, m] = this.startTime.split(':').map(Number);
    const d = new Date(0, 0, 0, h, m);
    d.setMinutes(d.getMinutes() + this.durationMinutes);
    return d.toTimeString().substring(0, 5);
  }

  isStartTimeAligned(): boolean {
    const [, minutes] = this.startTime.split(':').map(Number);
    return minutes % this.STEP_MINUTES === 0;
  }

  increaseDuration() {
    if (this.durationMinutes + this.STEP_MINUTES <= this.maxDuration) {
      this.durationMinutes += this.STEP_MINUTES;
    }
  }

  decreaseDuration() {
    if (this.durationMinutes - this.STEP_MINUTES >= this.minDuration) {
      this.durationMinutes -= this.STEP_MINUTES;
    }
  }

  selectDuration(minutes: number) {
    this.durationMinutes = minutes;
  }

  // =========================
  // SAVE (CREATE / UPDATE)
  // =========================

  save(): void {
    this.error = undefined;
    this.saving = true;

    // 🔒 Normalizar duración
    this.durationMinutes =
      Math.ceil(this.durationMinutes / this.STEP_MINUTES) * this.STEP_MINUTES;

    // 🔒 Validaciones base
    if (!this.isStartTimeAligned()) {
      this.error = 'Las citas deben iniciar en bloques de 30 minutos';
      this.saving = false;
      return;
    }

    if (this.durationMinutes < this.minDuration) {
      this.error = `La duración mínima es ${this.minDuration} minutos`;
      this.saving = false;
      return;
    }

    if (this.durationMinutes > this.maxDuration) {
      this.error = `La duración máxima permitida es ${this.maxDuration} minutos`;
      this.saving = false;
      return;
    }

// =====================================================
// ✏️ MODO EDICIÓN (NO TOCAR ORIGIN / CONSULTATION)
// =====================================================
    if (this.editMode) {

      if (!this.appointment) {
        this.error = 'No se pudo determinar la cita a editar';
        this.saving = false;
        return;
      }

      this.appointmentsService
        .updateAppointment(
          this.clinicId,
          this.appointment.patientId ?? 0, // solo para cumplir firma
          this.appointment.id,
          {
            durationMinutes: this.durationMinutes,
            reason: this.reason,
            sendEmail: this.sendEmail,
            reminderMinutesBefore: this.reminderMinutesBefore
            // ❌ NO origin
            // ❌ NO consultationId
          }
        )
        .subscribe({
          next: () => this.close.emit(true),
          error: err => {
            this.error =
              err?.error?.message || 'No se pudo actualizar la cita';
            this.saving = false;
          }
        });

      return;
    }


    // =====================================================
    // 🆕 CREAR CITA
    // =====================================================
    const createPayload = {
      date: this.date,
      startTime: this.startTime,
      durationMinutes: this.durationMinutes,
      reason: this.reason,
      sendEmail: this.sendEmail,
      reminderMinutesBefore: this.reminderMinutesBefore,
      origin: this.consultationId ? 'CLINICAL' : 'DIRECT',
      consultationId: this.consultationId ?? null
    };

    // 🟢 FLUJO CLÍNICO
    if (this.patientId) {
      this.appointmentsService
        .createAppointment(
          this.clinicId,
          this.patientId,
          this.doctorId,
          createPayload
        )
        .subscribe({
          next: () => {
            this.router.navigate(
              ['/dashboard/pacientes', this.patientId],
              {
                state: {
                  flashMessage: {
                    type: 'success',
                    message: 'Cita registrada y consulta finalizada correctamente'
                  }
                }
              }
            );
            this.close.emit(true);
          },
          error: err => {
            this.error = err?.error?.message || 'No se pudo crear la cita';
            this.saving = false;
          }
        });

      return;
    }

    // 🟡 AGENDA GLOBAL (DIRECT)
    this.appointmentsService
      .createAppointmentDirect(
        this.clinicId,
        this.doctorId,
        createPayload
      )
      .subscribe({
        next: () => this.close.emit(true),
        error: err => {
          this.error = err?.error?.message || 'No se pudo crear la cita';
          this.saving = false;
        }
      });
  }


  cancel(): void {
    this.close.emit(false);
  }

  cancelAppointment(): void {
    if (!this.appointment) return;

    // 🔒 VALIDACIÓN CLÍNICA REAL
    if (!this.appointment.patientId) {
      this.error = 'No se puede cancelar una cita sin paciente asociado';
      return;
    }

    if (!confirm('¿Cancelar esta cita?')) return;

    this.appointmentsService
      .cancelAppointment(
        this.clinicId,
        this.appointment.patientId,
        this.appointment.id
      )
      .subscribe({
        next: () => this.close.emit(true),
        error: err => {
          this.error =
            err?.error?.message || 'No se pudo cancelar la cita';
          this.saving = false;
        }
      });
  }

  loadPatientEmail() {
    if (!this.patientId) return;

    this.loadingEmail = true;

    this.appointmentsService
      .getPatientContact(this.patientId)
      .subscribe({
        next: (res) => {
          this.patientEmail = res.email ?? undefined;
          this.canSendEmail = !!res.email;
          this.loadingEmail = false;

          // 🔒 Si no hay email, forzar sendEmail = false
          if (!this.canSendEmail) {
            this.sendEmail = false;
          }
        },
        error: () => {
          this.loadingEmail = false;
          this.patientEmail = undefined;
          this.canSendEmail = false;
          this.sendEmail = false;
        }
      });
  }



}
