// src/app/features/appointments/calendar/appointments-calendar.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AppointmentsService } from '../../../core/services/appointments.service';
import { Appointment } from '../../../core/models/appointment.model';
import { DoctorSchedule } from '../../../core/models/doctor-schedule.model';
import {CreateAppointmentModal} from '../appointment/create-appointment.modal';


@Component({
  standalone: true,
  selector: 'app-appointments-calendar-page',
  imports: [CommonModule, FormsModule, CreateAppointmentModal],
  template: `
    <div class="p-6 bg-slate-100 min-h-screen">

      <!-- HEADER -->
      <div class="flex items-center justify-between mb-6 border-b pb-4">

        <div>
          <h1 class="text-2xl font-semibold text-slate-800">Agenda</h1>
          <p class="text-sm text-slate-500">
            {{ visibleDateLabel }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn-nav" (click)="goPrevBlock()">←</button>

          <button class="btn-nav btn-primary" (click)="goToday()">
            Hoy
          </button>

          <button class="btn-nav" (click)="goNextBlock()">→</button>

          <input
            type="date"
            [(ngModel)]="baseDate"
            (change)="onBaseDateChange()"
            class="ml-3 rounded border px-2 py-1 text-sm bg-white"
          />
        </div>
      </div>

      <!-- ALERTA -->
      <div
        *ngIf="!hasAnyWorkingScheduleInView()"
        class="mb-4 border border-amber-300 bg-amber-100 text-amber-900 px-4 py-2 text-sm rounded"
      >
        ⚠️ No tienes horario de atención para este día.
      </div>

      <!-- CALENDARIO -->
      <div class="calendar-grid">

        <!-- HORAS -->
        <div class="hours-col">
          <div class="hour-header-spacer"></div>

          <div
            *ngFor="let h of hours"
            class="hour-label"
          >
            {{ h }}:00
          </div>
        </div>

        <!-- DÍAS -->
        <div
          *ngFor="let day of visibleDates"
          class="day-column"
          [class.today-column]="isToday(day)"
        >


        <!-- HEADER DÍA -->
          <div class="day-header">
            {{ day }}
          </div>

          <!-- SLOTS -->
          <div
            *ngFor="let h of hours"
            class="time-slot"
            [ngClass]="slotClassForDay(day, h)"
            [attr.title]="slotTooltipForDay(day, h)"
            (click)="openCreateModalForDay(day, h)"
          >
        <span
          *ngIf="isBreakTimeForDay(day, h)"
          class="slot-break-label"
        >
          Descanso
        </span>
          </div>

          <!-- CITAS -->
          <div
            *ngFor="let ap of appointmentsForDay(day)"
            class="appointment-card"
            [ngClass]="statusClass(ap.status)"
            [style.top.px]="calcTop(ap.startTime) + 36"
            [style.height.px]="calcHeight(ap.durationMinutes) - 2"
          >
            <div class="appointment-time">
              {{ ap.startTime }} – {{ ap.endTime }}
            </div>

            <div
              class="appointment-reason"
              *ngIf="ap.durationMinutes >= 45"
            >
              {{ ap.reason || 'Consulta' }}
            </div>

          </div>

        </div>
      </div>

      <!-- MODAL -->
      <app-create-appointment-modal
        *ngIf="showCreateModal"
        [clinicId]="clinicId"
        [patientId]="patientId"
        [doctorId]="doctorId"
        [consultationId]="consultationId"
        [date]="selectedDate"
        [startTime]="selectedStartTime"
        (close)="onModalClosed($event)">
      </app-create-appointment-modal>

    </div>
  `,
  styles: [`
    /* ===============================
   BOTONES
================================ */
    .btn-nav {
      padding: 6px 12px;
      border: 1px solid #cbd5f5;
      border-radius: 6px;
      background: white;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-nav:hover {
      background: #eef2ff;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    /* ===============================
       GRID
    ================================ */
    .calendar-grid {
      display: grid;
      grid-template-columns: 90px repeat(5, 1fr);
      gap: 10px;
    }

    /* ===============================
       HORAS
    ================================ */
    .hours-col {
      display: flex;
      flex-direction: column;
    }

    .hour-header-spacer {
      height: 36px;
    }

    .hour-label {
      height: 64px;
      font-size: 12px;
      color: #000000;
      text-align: right;
      padding-right: 8px;
      padding-top: 6px;
    }

    /* ===============================
       DÍAS
    ================================ */
    .day-column {
      position: relative;
      background: #f8fafc;
      border-left: 2px solid #cbd5e1;
    }

    /* ===============================
   RESALTADO DEL DÍA ACTUAL
================================ */
    .today-column {
      border: 6px solid #BBDBFC; /* naranja clínico */
      background-color: #BBDBFC; /* fondo muy sutil */
    }

    .today-column .day-header {
      background-color: #EDE7FE;
      color: #080118;
      font-weight: 700;
    }


    .day-header {
      height: 36px;
      background: #e0e7ff;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      line-height: 24px;
      padding: 6px 0;
      border-bottom: 1px solid #c7d2fe;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    /* ===============================
       SLOTS
    ================================ */
    .time-slot {
      height: 64px;
      width: 100%;
      border-bottom: 1px solid #d1d5db;
      box-sizing: border-box;
      position: relative;
    }

    .slot-break-label {
      font-size: 11px;
      color: #92400e;
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      z-index: 1; /* importante */
    }


    /* ===============================
       ESTADOS SLOT
    ================================ */
    .bg-white {
      background: #ffffff;
    }

    .bg-slate-100 {
      background: #f1f5f9;
    }

    .bg-slate-200 {
      background: #e2e8f0;
    }

    .bg-slate-300 {
      background: #cbd5e1;
    }


    /* ===============================
   DESCANSO COMO BLOQUE (tipo cita)
================================ */
    .bg-amber-100 {
      background-color: #fef3c7;
      position: relative;
    }

    .bg-amber-100::before {
      content: '';
      position: absolute;
      inset: 6px;
      border-radius: 8px;
      background-color: #fde68a;
    }

    /* ===============================
       CITAS
    ================================ */
    .appointment-card {
      position: absolute;
      left: 6px;
      right: 6px;
      border-radius: 6px;
      padding: 6px;
      font-size: 12px;
      color: white;
      overflow: hidden;
      cursor: pointer;
    }

    .appointment-time {
      font-weight: 600;
      font-size: 12px;
    }

    .appointment-reason {
      font-size: 11px;
      opacity: 0.95;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ===============================
       ESTADOS CITA
    ================================ */
    .bg-scheduled {
      background-color: #0476D0;
      border-left: 4px solid #d97706;
    }


    .bg-completed {
      background-color: #16a34a;
    }

    .bg-cancelled {
      background-color: #9ca3af;
    }

    .bg-no-show {
      background-color: #dc2626;
    }


  `]
})
export class AppointmentsCalendarPage implements OnInit {

  private route = inject(ActivatedRoute);
  private appointmentsService = inject(AppointmentsService);

  clinicId!: number;
  doctorId!: number;
  patientId!: number;
  consultationId!: number;

  // Fecha base del bloque (inicio de los 5 días)
  baseDate!: string;

// Fechas visibles (5 días consecutivos)
  visibleDates: string[] = [];

// Texto  para el header
  visibleDateLabel = '';

  selectedDate!: string;
  selectedStartTime!: string;

  appointments: Appointment[] = [];
  doctorSchedules: DoctorSchedule[] = [];

  showCreateModal = false;

  hours = Array.from({ length: 11 }, (_, i) => i + 8);

  async ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;

    this.clinicId = Number(qp.get('clinicId')) || 1;
    this.doctorId = Number(qp.get('doctorId'));
    this.patientId = Number(qp.get('patientId'));
    this.consultationId = Number(qp.get('consultationId'));

    this.baseDate = new Date().toISOString().substring(0, 10);
    this.selectedDate = this.baseDate; // 🔥 ESTA FALTABA

    this.recalculateVisibleDates();

    await this.loadDoctorSchedule();
    await this.loadAgenda();
  }

  onDateChange() {
    this.loadAgenda();
  }

  async loadDoctorSchedule() {
    this.doctorSchedules = await firstValueFrom(
      this.appointmentsService.getDoctorSchedule()
    );
  }

  async loadAgenda() {

    // 🛡️ defensa
    if (!this.visibleDates || this.visibleDates.length === 0) {
      this.appointments = [];
      return;
    }

    const all: Appointment[] = [];

    for (const day of this.visibleDates) {
      const daily = await firstValueFrom(
        this.appointmentsService.getDoctorAgenda(
          this.clinicId,
          this.doctorId,
          day
        )
      ) ?? [];

      all.push(...daily);
    }

    this.appointments = all;
  }


  getScheduleForSelectedDay(): DoctorSchedule | undefined {

    // 🛡️ DEFENSA: estado aún no inicializado
    if (!this.selectedDate || this.doctorSchedules.length === 0) {
      return undefined;
    }

    const [y, m, d] = this.selectedDate.split('-').map(Number);
    const jsDay = new Date(y, m - 1, d).getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    return this.doctorSchedules.find(s => s.dayOfWeek === dayOfWeek);
  }


  hasWorkingScheduleForDay(): boolean {
    return !!this.getScheduleForSelectedDay()?.active;
  }

  isWithinWorkingHours(hour: number): boolean {
    const s = this.getScheduleForSelectedDay();
    if (!s || !s.active) return false;

    const t = hour * 60;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);

    return t >= sh * 60 + sm && t < eh * 60 + em;
  }

  isBreakTime(hour: number): boolean {
    const s = this.getScheduleForSelectedDay();
    if (!s?.hasBreak) return false;

    const t = hour * 60;
    const [bh, bm] = s.breakStart!.split(':').map(Number);
    const [eh, em] = s.breakEnd!.split(':').map(Number);

    return t >= bh * 60 + bm && t < eh * 60 + em;
  }

  isSlotAvailable(hour: number): boolean {
    return !this.appointments.some(a =>
      a.startTime.startsWith(hour.toString().padStart(2, '0'))
    );
  }

  openCreateModal(hour: number) {
    if (!this.hasWorkingScheduleForDay()) {
      alert('No atiendes este día.');
      return;
    }
    if (!this.isWithinWorkingHours(hour)) {
      alert('Fuera de tu horario.');
      return;
    }
    if (this.isBreakTime(hour)) {
      alert('Horario de descanso.');
      return;
    }
    if (!this.isSlotAvailable(hour)) {
      alert('Horario ocupado.');
      return;
    }

    this.selectedStartTime = `${hour.toString().padStart(2, '0')}:00`;
    this.showCreateModal = true;
  }

  onModalClosed(created: boolean) {
    this.showCreateModal = false;
    if (created) this.loadAgenda();
  }

// Escala compacta estilo DocPlanner
  private readonly PIXELS_PER_HOUR = 64;

  calcTop(start: string): number {
    const [h, m] = start.split(':').map(Number);
    return ((h - 8) * 60 + m) * (this.PIXELS_PER_HOUR / 60);
  }

  calcHeight(duration: number): number {
    return duration * (this.PIXELS_PER_HOUR / 60);
  }


  statusClass(status: string) {
    return {
      'bg-scheduled': status === 'SCHEDULED',
      'bg-completed': status === 'COMPLETED',
      'bg-cancelled': status === 'CANCELLED',
      'bg-no-show': status === 'NO_SHOW'
    };
  }

  slotClass(hour: number) {
    if (!this.hasWorkingScheduleForDay()) return 'bg-slate-100 cursor-not-allowed';
    if (!this.isWithinWorkingHours(hour)) return 'bg-slate-100 cursor-not-allowed';
    if (this.isBreakTime(hour)) return 'bg-amber-100 cursor-not-allowed';
    if (!this.isSlotAvailable(hour)) return 'bg-slate-300 cursor-not-allowed';

    return 'bg-white hover:bg-emerald-50 cursor-pointer';
  }

  // ==============================
// 📅 MANEJO DE FECHAS DEL HEADER
// ==============================

  recalculateVisibleDates() {
    const [y, m, d] = this.baseDate.split('-').map(Number);
    const start = new Date(y, m - 1, d);

    this.visibleDates = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      this.visibleDates.push(date.toISOString().substring(0, 10));
    }

    this.updateVisibleDateLabel();
  }

  updateVisibleDateLabel() {
    if (this.visibleDates.length === 0) {
      this.visibleDateLabel = '';
      return;
    }

    const first = this.visibleDates[0];
    const last = this.visibleDates[this.visibleDates.length - 1];

    this.visibleDateLabel = `${first} → ${last}`;
  }

  goPrevBlock() {
    const [y, m, d] = this.baseDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 5);

    this.baseDate = date.toISOString().substring(0, 10);
    this.selectedDate = this.baseDate; // 🔧
    this.recalculateVisibleDates();
    this.loadAgenda();

  }

  goNextBlock() {
    const [y, m, d] = this.baseDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 5);
    this.baseDate = date.toISOString().substring(0, 10);
    this.selectedDate = this.baseDate; // 🔧
    this.recalculateVisibleDates();
    this.loadAgenda();
  }

  goToday() {
    this.baseDate = new Date().toISOString().substring(0, 10);
    this.selectedDate = this.baseDate; // 🔧
    this.recalculateVisibleDates();
    this.loadAgenda();
  }

  onBaseDateChange() {
    this.selectedDate = this.baseDate; // 🔧 sincroniza
    this.recalculateVisibleDates();
    this.loadAgenda();
  }

  // ==============================
// 🗓️ LÓGICA MULTIDÍA
// ==============================

  appointmentsForDay(day: string): Appointment[] {
    return this.appointments.filter(a => a.date === day);
  }

  getScheduleForDay(day: string): DoctorSchedule | undefined {
    if (!day || this.doctorSchedules.length === 0) return undefined;

    const [y, m, d] = day.split('-').map(Number);
    const jsDay = new Date(y, m - 1, d).getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    return this.doctorSchedules.find(s => s.dayOfWeek === dayOfWeek);
  }

  hasWorkingScheduleForDayDate(day: string): boolean {
    return !!this.getScheduleForDay(day)?.active;
  }

  isWithinWorkingHoursForDay(day: string, hour: number): boolean {
    const s = this.getScheduleForDay(day);
    if (!s || !s.active) return false;

    const t = hour * 60;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);

    return t >= sh * 60 + sm && t < eh * 60 + em;
  }

  isBreakTimeForDay(day: string, hour: number): boolean {
    const s = this.getScheduleForDay(day);
    if (!s?.hasBreak) return false;

    const t = hour * 60;
    const [bh, bm] = s.breakStart!.split(':').map(Number);
    const [eh, em] = s.breakEnd!.split(':').map(Number);

    return t >= bh * 60 + bm && t < eh * 60 + em;
  }

  isSlotAvailableForDay(day: string, hour: number): boolean {
    return !this.appointments.some(a =>
      a.date === day &&
      a.startTime.startsWith(hour.toString().padStart(2, '0'))
    );
  }

  slotClassForDay(day: string, hour: number) {
    // ❌ Fecha pasada completa
    // Día completo en el pasado
    if (this.isPastDay(day)) {
      return 'bg-slate-200 cursor-not-allowed';
    }

// Hoy, pero hora pasada
    if (this.isPastSlot(day, hour)) {
      return 'bg-slate-200 cursor-not-allowed';
    }


    if (!this.hasWorkingScheduleForDayDate(day)) {
      return 'bg-slate-100 cursor-not-allowed';
    }

    if (!this.isWithinWorkingHoursForDay(day, hour)) {
      return 'bg-slate-100 cursor-not-allowed';
    }

    if (this.isBreakTimeForDay(day, hour)) {
      return 'bg-amber-100 cursor-not-allowed';
    }

    if (!this.isSlotAvailableForDay(day, hour)) {
      return 'bg-slate-300 cursor-not-allowed';
    }


    return 'bg-white hover:bg-emerald-50 cursor-pointer';
  }

  openCreateModalForDay(day: string, hour: number) {
    if (this.isPastDay(day)) return;
    if (this.isPastSlot(day, hour)) return;
    if (!this.hasWorkingScheduleForDayDate(day)) return;
    if (!this.isWithinWorkingHoursForDay(day, hour)) return;
    if (this.isBreakTimeForDay(day, hour)) return;
    if (!this.isSlotAvailableForDay(day, hour)) return;

    this.selectedDate = day;
    this.selectedStartTime = `${hour.toString().padStart(2, '0')}:00`;
    this.showCreateModal = true;
  }


  // ⏰ Verifica si un slot ya pasó (solo aplica para HOY)
  isPastSlot(day: string, hour: number): boolean {
    const [y, m, d] = day.split('-').map(Number);
    const slotDate = new Date(y, m - 1, d, hour, 0, 0);

    const now = new Date();

    // Solo bloqueamos si es el mismo día
    if (
      slotDate.getFullYear() !== now.getFullYear() ||
      slotDate.getMonth() !== now.getMonth() ||
      slotDate.getDate() !== now.getDate()
    ) {
      return false;
    }

    return slotDate.getTime() <= now.getTime();
  }

  slotTooltipForDay(day: string, hour: number): string {

    if (this.isPastDay(day)) {
      return 'No se pueden agendar citas en fechas pasadas';
    }
    if (this.isPastSlot(day, hour)) {
      return 'Este horario ya pasó';
    }

    if (!this.hasWorkingScheduleForDayDate(day)) {
      return 'No atiendes este día';
    }

    if (!this.isWithinWorkingHoursForDay(day, hour)) {
      return 'Fuera de tu horario de atención';
    }

    if (this.isBreakTimeForDay(day, hour)) {
      return 'Horario de descanso';
    }

    if (!this.isSlotAvailableForDay(day, hour)) {
      return 'Ya existe una cita en este horario';
    }

    return 'Click para agendar cita';
  }
  isToday(day: string): boolean {
    const today = new Date();
    const [y, m, d] = day.split('-').map(Number);

    return (
      today.getFullYear() === y &&
      today.getMonth() + 1 === m &&
      today.getDate() === d
    );
  }

  isPastDay(day: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);

    return date < today;
  }

  hasAnyWorkingScheduleInView(): boolean {
    return this.visibleDates.some(day => {
      const schedule = this.getScheduleForDay(day);
      return schedule?.active;
    });
  }

}
