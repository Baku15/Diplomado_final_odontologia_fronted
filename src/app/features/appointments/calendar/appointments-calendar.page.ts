// src/app/features/appointments/calendar/appointments-calendar.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import { FormsModule } from '@angular/forms';
import {firstValueFrom, Observable} from 'rxjs';

import { AppointmentsService } from '../../../core/services/appointments.service';
import { Appointment } from '../../../core/models/appointment.model';
import { DoctorSchedule } from '../../../core/models/doctor-schedule.model';
import {CreateAppointmentModal} from '../appointment/create-appointment.modal';
import {CurrentUserService} from '../../../core/services/current-user.service';
import {AuthService} from '../../../core/services/auth.service';
import {HttpClient} from '@angular/common/http';
import {AppointmentDetailModal} from '../appointment/appointment-detail.modal';
import { ViewChild } from '@angular/core';
import { ToastComponent } from '../../../shared/toast/toast.component';


interface MeResponse {
  id: number;
  username: string;
  roles: string[];
  clinicId?: number | null;
}

@Component({
  standalone: true,
  selector: 'app-appointments-calendar-page',
  imports: [CommonModule, FormsModule, CreateAppointmentModal,AppointmentDetailModal,ToastComponent],
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
    <div class="calendar-scroll">
      <div class="calendar-grid">

        <!-- HORAS -->
        <div class="hours-col">
          <div class="hour-header-spacer"></div>
          <div *ngFor="let t of timeSlots" class="hour-label">
            {{ t }}
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
            <span class="day-name">{{ getDayName(day) }}</span>
            <span class="day-date">{{ getDayFullDate(day) }}</span>
          </div>

          <!-- SLOTS -->
          <div
            *ngFor="let t of timeSlots"
            class="time-slot"
            [ngClass]="slotClassForDayTime(day, t)"
            [attr.title]="slotTooltipForDayTime(day, t)"
            (click)="openCreateModalForDayTime(day, t)"
          ></div>

          <!-- CITAS -->
          <div
            *ngFor="let ap of appointmentsForDay(day)"
            class="appointment-card"
            [ngClass]="statusClass(ap.status)"
            [style.top.px]="calcTop(ap.startTime) + 36"
            [style.height.px]="calcHeight(getNormalizedDuration(ap)) - 2"
            (click)="openAppointmentActions($event, ap)"
          >

            <!-- DESCANSO -->
            <div
              *ngFor="let b of getBreakBlocksForDay(day)"
              class="appointment-card break-card"
              [style.top.px]="calcTop(b.startTime) + 36"
              [style.height.px]="calcHeight(b.durationMinutes) - 2"
            >
              Descanso
            </div>

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
    </div>

    <!-- ========================= -->
    <!-- 🎯 MENÚ DE ACCIONES CITA -->
    <!-- ========================= -->
    <div
      *ngIf="showAppointmentActions"
      class="fixed z-[200] bg-white border rounded-lg shadow-xl w-52 text-sm overflow-hidden"
      [style.left.px]="actionPosition.x"
      [style.top.px]="actionPosition.y"
      (click)="$event.stopPropagation()"
    >


      <!-- ✏️ EDITAR -->
      <button
        *ngIf="selectedAppointment && isEditable(selectedAppointment)"
        (click)="editAppointment()"
        class="action-btn flex items-center gap-2"
      >
        ✏️ Editar
      </button>

      <!-- 🚫 NO SHOW -->
      <button
        *ngIf="selectedAppointment && isEditable(selectedAppointment) && isPastAppointment(selectedAppointment)"
        (click)="markNoShow()"
        class="action-btn flex items-center gap-2 text-amber-600"
      >
        🚫 No asistió
      </button>

      <!-- ❌ CANCELAR -->
      <button
        *ngIf="selectedAppointment && !isEditable(selectedAppointment)"
        (click)="cancelAppointment()"
        class="action-btn danger flex items-center gap-2"
      >
        ❌ Cancelar
      </button>

      <button
        *ngIf="!isEditable(selectedAppointment!)"
        (click)="openDetail(selectedAppointment!)"
        class="action-btn flex items-center gap-2"
      >
        👁️ Ver detalle
      </button>

      <!-- ✅ MARCAR COMO COMPLETADA (SOLO DIRECT) -->
      <button
        *ngIf="selectedAppointment && canCompleteDirect(selectedAppointment)"
        (click)="completeDirectAppointment()"
        class="action-btn flex items-center gap-2 text-emerald-600"
      >
        ✅ Marcar como completada
      </button>



    </div>

    </div>

    <!-- BACKDROP (CIERRA MENÚ AL CLICK FUERA) -->
    <div
      *ngIf="showAppointmentActions"
      class="fixed inset-0 z-[150]"
      (click)="closeAppointmentActions()"
    ></div>

    <!-- MODAL CREAR / EDITAR CITA -->
    <app-create-appointment-modal
      *ngIf="showCreateModal"
      [clinicId]="clinicId"
      [patientId]="patientId"
      [doctorId]="doctorId"
      [consultationId]="consultationId"
      [appointment]="editingAppointment"
      [editMode]="!!editingAppointment"
      [date]="selectedDate"
      [startTime]="selectedStartTime"
      (close)="onModalClosed($event)">
    </app-create-appointment-modal>

  <app-appointment-detail-modal
    *ngIf="showDetailModal && detailAppointment"
    [appointment]="detailAppointment"
    [clinicId]="clinicId"
    (close)="onCloseDetailModal()">
  </app-appointment-detail-modal>
  <app-toast></app-toast>
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

    /* ===============================
   MENÚ ACCIONES CITA
================================ */
    .action-btn {
      display: block;
      width: 100%;
      padding: 8px 12px;
      text-align: left;
      background: white;
      border: none;
      cursor: pointer;
    }

    .action-btn:hover {
      background: #f1f5f9;
    }

    .action-btn.danger {
      color: #dc2626;
    }

    .action-btn.danger:hover {
      background: #fee2e2;
    }


    .btn-nav:hover {
      background: #eef2ff;
    }

    .break-card {
      background-color: #fde68a;
      color: #92400e;
      font-weight: 600;
      cursor: default;
    }

    /* ===============================
   SCROLL VERTICAL DEL CALENDARIO
================================ */
    .calendar-scroll {
      max-height: calc(100vh - 220px); /* ajusta según tu header */
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Mantiene header del día fijo */
    .day-header {
      position: sticky;
      top: 0;
      z-index: 20;
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
      height: 48px; /* debe coincidir con el slot */
      font-size: 11px;
      color: #000000;
      text-align: right;
      padding-right: 8px;
      padding-top: 6px;
      box-sizing: border-box;
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
      height: 48px; /* 30 minutos - MÁS GRANDE */
      width: 100%;
      border-bottom: 1px solid #e5e7eb;
      box-sizing: border-box;
      position: relative;
      background: transparent;
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

    .day-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;              /* separación horizontal */
      white-space: nowrap;  /* 🔒 evita salto de línea */
    }

    .day-header .day-name {
      font-weight: 700;
      font-size: 12px;
      color: #1e293b; /* slate-800 */
      letter-spacing: 0.5px;
    }

    .day-header .day-date {
      font-weight: 500;
      font-size: 11px;
      color: #475569; /* slate-600 */
    }
    .bg-completed {
      background-color: #16a34a;
      opacity: 0.85;
      cursor: default;
    }

    .bg-cancelled {
      background-color: #9ca3af;
      opacity: 0.7;
      text-decoration: line-through;
      cursor: default;
    }

    .bg-no-show {
      background-color: #dc2626;
      opacity: 0.85;
      cursor: default;
    }




  `]
})
export class AppointmentsCalendarPage implements OnInit {

  // ==============================
// 🎯 MENÚ DE ACCIONES CITA
// ==============================
  @ViewChild(ToastComponent)
  toast!: ToastComponent;
  showDetailModal = false;
  detailAppointment?: Appointment;

  selectedAppointment?: Appointment;
  showAppointmentActions = false;
  actionPosition = {x: 0, y: 0};


  private route = inject(ActivatedRoute);
  private appointmentsService = inject(AppointmentsService);
  private authService = inject(AuthService);
  private router = inject(Router);


  private http = inject(HttpClient);
  private readonly STEP_MINUTES = 30;
  private readonly PIXELS_PER_SLOT = 48; // 30 minutos (más grande)
  private readonly START_HOUR = 8;        // inicio del calendario


  clinicId!: number;
  doctorId!: number;
  patientId?: number;
  consultationId?: number;

  editingAppointment?: Appointment;

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

  timeSlots: string[] = [];

  async ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
// 🔥 OBTENER DOCTOR REAL DESDE BACKEND
    const me = await firstValueFrom(
      this.http.get<MeResponse>('/api/me')
    );

    this.generateTimeSlots();

// 🛡️ Defensa real
    if (!me || !me.id) {
      throw new Error('No se pudo determinar el odontólogo autenticado');
    }

    this.doctorId = me.id;

    this.clinicId = Number(qp.get('clinicId')) || 1;


    // 🔹 Solo existen si venimos del flujo clínico
    this.patientId = qp.get('patientId')
      ? Number(qp.get('patientId'))
      : undefined;

    this.consultationId = qp.get('consultationId')
      ? Number(qp.get('consultationId'))
      : undefined;
    // 🔹 Fechas
    this.baseDate = this.getLocalDateString();
    this.selectedDate = this.baseDate;

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
          day,
          this.patientId || undefined
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

  onModalClosed(updated: boolean) {
    this.showCreateModal = false;
    this.editingAppointment = undefined;

    if (updated) {
      this.loadAgenda();
    }
  }


// Escala compacta estilo DocPlanner

  calcTop(start: string): number {
    const [h, m] = start.split(':').map(Number);

    const minutesFromStart =
      (h - this.START_HOUR) * 60 + m;

    const slotsFromStart = minutesFromStart / this.STEP_MINUTES;

    return slotsFromStart * this.PIXELS_PER_SLOT;
  }


  calcHeight(duration: number): number {
    const normalized = this.normalizeDuration(duration);
    const slots = normalized / this.STEP_MINUTES;
    return slots * this.PIXELS_PER_SLOT;
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
    this.baseDate = this.getLocalDateString()
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

  getLocalDateString(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  normalizeDuration(minutes: number): number {
    return Math.ceil(minutes / this.STEP_MINUTES) * this.STEP_MINUTES;
  }

  timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  isIntervalAvailable(
    day: string,
    startTime: string,
    durationMinutes: number
  ): boolean {

    const start = this.timeToMinutes(startTime);
    const end = start + this.normalizeDuration(durationMinutes);

    return !this.appointments.some(a => {
      if (a.date !== day) return false;

      const aStart = this.timeToMinutes(a.startTime);
      const aEnd = aStart + this.normalizeDuration(a.durationMinutes);

      return start < aEnd && end > aStart;
    });
  }

  getNormalizedDuration(ap: Appointment): number {
    return Math.ceil(ap.durationMinutes / 30) * 30;
  }

  getBreakBlocksForDay(day: string) {
    const schedule = this.getScheduleForDay(day);
    if (!schedule?.hasBreak) return [];

    const start = schedule.breakStart!;
    const end = schedule.breakEnd!;

    return [{
      startTime: start,
      durationMinutes:
        this.timeToMinutes(end) - this.timeToMinutes(start)
    }];
  }


  generateTimeSlots() {
    this.timeSlots = [];

    for (let h = 8; h < 22; h++) {
      this.timeSlots.push(`${String(h).padStart(2, '0')}:00`);
      this.timeSlots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }

  slotClassForDayTime(day: string, time: string): string {

    if (this.isPastDay(day)) {
      return 'bg-slate-200 cursor-not-allowed';
    }

    if (this.isPastSlotTime(day, time)) {
      return 'bg-slate-200 cursor-not-allowed';
    }

    if (!this.hasWorkingScheduleForDayDate(day)) {
      return 'bg-slate-100 cursor-not-allowed';
    }

    if (!this.isWithinWorkingHoursForDayTime(day, time)) {
      return 'bg-slate-100 cursor-not-allowed';
    }

    if (!this.isIntervalAvailable(day, time, this.STEP_MINUTES)) {
      return 'bg-slate-300 cursor-not-allowed';
    }

    return 'bg-white hover:bg-emerald-50 cursor-pointer';
  }

  slotTooltipForDayTime(day: string, time: string): string {

    if (this.isPastDay(day)) {
      return 'No se pueden agendar citas en fechas pasadas';
    }

    if (this.isPastSlotTime(day, time)) {
      return 'Este horario ya pasó';
    }

    if (!this.hasWorkingScheduleForDayDate(day)) {
      return 'No atiendes este día';
    }

    if (!this.isWithinWorkingHoursForDayTime(day, time)) {
      return 'Fuera de tu horario de atención';
    }

    if (!this.isIntervalAvailable(day, time, this.STEP_MINUTES)) {
      return 'Ya existe una cita en este horario';
    }

    return 'Click para agendar cita';
  }

  openCreateModalForDayTime(day: string, time: string) {

    if (this.isPastDay(day)) return;
    if (this.isPastSlotTime(day, time)) return;
    if (!this.hasWorkingScheduleForDayDate(day)) return;
    if (!this.isWithinWorkingHoursForDayTime(day, time)) return;
    if (!this.isIntervalAvailable(day, time, this.STEP_MINUTES)) return;

    this.selectedDate = day;
    this.selectedStartTime = time;

    this.editingAppointment = undefined;

    // 🔥 CLAVE ABSOLUTA
    // SOLO limpiar si NO venimos del flujo clínico
    if (!this.consultationId) {
      this.patientId = undefined;
    }

    // ⚠️ NO TOCAR consultationId AQUÍ
    // Si venimos del odontograma, ya existe y define ORIGIN = CLINICAL

    this.showCreateModal = true;
  }



  isPastSlotTime(day: string, time: string): boolean {
    const [h, m] = time.split(':').map(Number);
    const [y, mo, d] = day.split('-').map(Number);

    const slotDate = new Date(y, mo - 1, d, h, m);
    return slotDate.getTime() <= new Date().getTime();
  }

  isWithinWorkingHoursForDayTime(day: string, time: string): boolean {
    const s = this.getScheduleForDay(day);
    if (!s || !s.active) return false;

    const t = this.timeToMinutes(time);
    const start = this.timeToMinutes(s.startTime);
    const end = this.timeToMinutes(s.endTime);

    return t >= start && t + this.STEP_MINUTES <= end;
  }

  getDayHeaderLabel(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const days = [
      'DOMINGO',
      'LUNES',
      'MARTES',
      'MIÉRCOLES',
      'JUEVES',
      'VIERNES',
      'SÁBADO'
    ];

    const dayName = days[date.getDay()];
    const dayNumber = String(d).padStart(2, '0');
    const monthNumber = String(m).padStart(2, '0');
    const yearNumber = y;

    // ✅ FECHA COMPLETA EN UNA SOLA LÍNEA
    return `${dayName} ${dayNumber}/${monthNumber}/${yearNumber}`;
  }

  getDayName(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const days = [
      'DOMINGO',
      'LUNES',
      'MARTES',
      'MIÉRCOLES',
      'JUEVES',
      'VIERNES',
      'SÁBADO'
    ];

    return days[date.getDay()];
  }

  getDayFullDate(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  openAppointmentActions(
    event: MouseEvent,
    ap: Appointment
  ) {
    event.stopPropagation();

    this.selectedAppointment = ap;
    this.showAppointmentActions = true;

    this.actionPosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  closeAppointmentActions() {
    this.showAppointmentActions = false;
    this.selectedAppointment = undefined;
  }


// ✏️ EDITAR
  editAppointment() {
    if (!this.selectedAppointment) return;

    const ap = this.selectedAppointment;

    // Agenda administrativa → SIEMPRE editable si está SCHEDULED
    this.selectedDate = ap.date;
    this.selectedStartTime = ap.startTime;

    this.patientId = ap.patientId ?? undefined;
    this.consultationId = ap.consultationId ?? undefined;

    this.editingAppointment = ap;
    this.showCreateModal = true;

    this.closeAppointmentActions();
  }



// ❌ CANCELAR
  cancelAppointment() {
    if (!this.selectedAppointment) return;

    const ap = this.selectedAppointment;

    if (ap.patientId == null) {
      this.closeAppointmentActions();
      return;
    }

    this.appointmentsService
      .cancelAppointment(this.clinicId, ap.patientId, ap.id)
      .subscribe(() => {
        this.loadAgenda();
        this.closeAppointmentActions();

        this.toast.show(
          'success',
          'Cita cancelada',
          'La cita fue cancelada correctamente.'
        );
        this.closeAppointmentActions();
      });
  }


// 🚫 NO SHOW
  markNoShow() {
    if (!this.selectedAppointment) return;

    const ap = this.selectedAppointment;

    // 🔒 NO_SHOW requiere paciente
    if (!ap.patientId) {
      alert('Esta acción requiere un paciente asociado.');
      return;
    }

    this.appointmentsService
      .markNoShow(
        this.clinicId,
        ap.patientId,
        ap.id
      )
      .subscribe(() => this.loadAgenda());

    this.closeAppointmentActions();
  }

  isEditable(ap: Appointment): boolean {
    return ap.status === 'SCHEDULED';
  }

  isAttendable(ap: Appointment): boolean {
    if (ap.status !== 'SCHEDULED') return false;

    const today = this.getLocalDateString();
    return ap.date === today;
  }

  isPastAppointment(ap: Appointment): boolean {
    const today = this.getLocalDateString();
    return ap.date < today;
  }

  openDetail(ap: Appointment) {
    this.detailAppointment = ap;
    this.showDetailModal = true;

    // 🔥 cerrar menú de acciones
    this.closeAppointmentActions();
  }

  onCloseDetailModal() {
    this.showDetailModal = false;
    this.detailAppointment = undefined;
  }

  canCompleteDirect(ap: Appointment): boolean {
    return ap.origin === 'DIRECT' && ap.status === 'SCHEDULED';
  }

  completeDirectAppointment() {
    if (!this.selectedAppointment) return;

    const ap = this.selectedAppointment;

    this.appointmentsService
      .completeDirectAppointment(
        this.clinicId,
        0,          // 🔥 DIRECT → sin paciente
        ap.id
      )
      .subscribe({
        next: () => {
          this.loadAgenda();
          this.toast.show(
            'success',
            'Cita completada',
            'La cita fue finalizada correctamente.'
          );
          this.closeAppointmentActions();
        },
        error: () => {
          this.toast.show(
            'error',
            'Error',
            'No se pudo completar la cita.'
          );
        }
      });
  }

}
