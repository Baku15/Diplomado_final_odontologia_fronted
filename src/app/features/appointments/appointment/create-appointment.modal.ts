import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {AppointmentsService} from '../../../core/services/appointments.service';


@Component({
  standalone: true,
  selector: 'app-create-appointment-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-appointment.modal.html',
  styleUrls: ['./create-appointment.modal.scss']
})
export class CreateAppointmentModal {

  @Input() clinicId!: number;
  @Input() patientId!: number;
  @Input() doctorId!: number;
  @Input() consultationId!: number;

  @Input() date!: string;       // YYYY-MM-DD
  @Input() startTime!: string;  // HH:mm

  @Output() close = new EventEmitter<boolean>();

  // formulario
  durationMinutes = 30;
  reason = '';

  sendEmail = false;
  sendWhatsapp = false;
  reminderMinutesBefore = 2880; // 48h por defecto

  saving = false;
  error?: string;

  constructor(
    private appointmentsService: AppointmentsService
  ) {}

  get endTime(): string {
    const [h, m] = this.startTime.split(':').map(Number);
    const date = new Date(0, 0, 0, h, m);
    date.setMinutes(date.getMinutes() + this.durationMinutes);

    return date.toTimeString().substring(0, 5);
  }

  save(): void {
    this.error = undefined;
    this.saving = true;

    const payload = {
      date: this.date,
      startTime: this.startTime,
      durationMinutes: this.durationMinutes,
      reason: this.reason,
      sendEmail: this.sendEmail,
      sendWhatsapp: this.sendWhatsapp,
      reminderMinutesBefore: this.reminderMinutesBefore,

      origin: this.consultationId ? 'CLINICAL' : 'DIRECT',
      consultationId: this.consultationId ?? null
    };


    this.appointmentsService
      .createAppointment(
        this.clinicId,
        this.patientId,
        this.doctorId,
        payload
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
}
