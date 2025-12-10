import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PatientService } from './patient.service';

@Component({
  standalone: true,
  selector: 'app-patient-create-wizard',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        <div class="px-6 py-5 border-b">
          <h2 class="text-xl font-semibold text-slate-900">Registrar nuevo paciente</h2>
          <p class="text-sm text-slate-500 mt-1">Completa los datos básicos. Luego podrás agregar su historial clínico.</p>
        </div>

        <!-- STEP 1: Personal -->
        <form [formGroup]="personalForm" (ngSubmit)="goToContact()" class="px-6 py-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Nombres <span class="text-rose-600">*</span></label>
              <input formControlName="givenName" type="text" placeholder="Ej. Ana María"
                     class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p *ngIf="givenName.invalid && (givenName.touched || givenName.dirty)" class="text-xs text-rose-600 mt-1">
                {{ getGivenNameError() }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Apellidos <span class="text-rose-600">*</span></label>
              <input formControlName="familyName" type="text" placeholder="Ej. Pérez Gutiérrez"
                     class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p *ngIf="familyName.invalid && (familyName.dirty || familyName.touched)" class="text-xs text-rose-600 mt-1">
                {{ getFamilyNameError() }}
              </p>
            </div>

            <!-- Document Type -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Documento (tipo)</label>
              <select formControlName="documentType"
                      (change)="updateDocumentExample()"
                      class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">-- Sin documento --</option>
                <option value="CI">CI</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <!-- Dynamic Document Number -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">
                Número documento
                <span *ngIf="documentExample" class="text-slate-400 ml-1">({{ documentExample }})</span>
              </label>

              <input formControlName="documentNumber"
                     type="text"
                     [placeholder]="documentExample || 'Ingresa el número'"
                     class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />

              <p *ngIf="documentNumber.invalid && (documentNumber.touched || documentNumber.dirty)"
                 class="text-xs text-rose-600 mt-1">
                {{ getDocumentNumberError() }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
              <input formControlName="birthDate" type="date"
                     class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Sexo</label>
              <select formControlName="sex"
                      class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">No especificado</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro / No declarar</option>
              </select>
            </div>

          </div>

          <div class="mt-6 flex items-center justify-between">
            <div class="text-xs text-slate-500">Campos marcados con <span class="text-rose-600">*</span> son obligatorios.</div>

            <button type="submit"
                    [disabled]="personalForm.invalid"
                    class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60">
              Siguiente: Contacto
            </button>
          </div>
        </form>


        <!-- STEP 2: Contact -->
        <div *ngIf="showContact" class="px-6 py-6 border-t">

          <h3 class="text-lg font-semibold text-slate-900">Contacto y telecomunicaciones</h3>
          <p class="text-sm text-slate-500 mt-1">Teléfonos, dirección, foto y preferencias de recordatorio.</p>

          <form [formGroup]="contactForm" (ngSubmit)="submit()" class="mt-4 space-y-4" enctype="multipart/form-data">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

              <!-- MAIN PHONE -->
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  Número principal (WhatsApp) <span class="text-rose-600">*</span>
                </label>

                <div class="relative">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">+591</div>

                  <input type="tel"
                         [value]="phoneMainDisplay"
                         (input)="onPhoneMainInput($any($event.target).value)"
                         (blur)="onPhoneMainBlur()"
                         placeholder="7xxxxxxx"
                         class="w-full rounded-lg border px-3 py-2 pl-14 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                <p class="text-xs text-slate-400 mt-1">Ingresa 8 dígitos (ej. 76543210).</p>
                <p *ngIf="phoneMainInvalid && phoneMainTouched" class="text-xs text-rose-600 mt-1">{{ phoneMainErrorText }}</p>
              </div>

              <!-- ALT PHONE -->
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Teléfono alternativo (opcional)</label>

                <div class="relative">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">+591</div>

                  <input type="tel"
                         [value]="phoneAltDisplay"
                         (input)="onPhoneAltInput($any($event.target).value)"
                         (blur)="onPhoneAltBlur()"
                         placeholder="76543210"
                         class="w-full rounded-lg border px-3 py-2 pl-14 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>

              <!-- EMAIL -->
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Correo electrónico</label>
                <input formControlName="email" type="email" placeholder="ejemplo@correo.com"
                       class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <p *ngIf="email.invalid && (email.touched || email.dirty)" class="text-xs text-rose-600 mt-1">{{ getEmailError() }}</p>
              </div>

              <!-- REMINDERS -->
              <div class="flex flex-col gap-3">
                <label class="text-xs font-medium text-slate-700">Preferencias de recordatorio</label>

                <label class="inline-flex items-center gap-2">
                  <input type="checkbox"
                         [disabled]="!email.valid"
                         formControlName="allowEmailReminders"
                         class="h-4 w-4 rounded border" />
                  <span class="text-sm">Permitir recordatorios por email</span>
                </label>

                <label class="inline-flex items-center gap-2">
                  <input type="checkbox"
                         [disabled]="!phoneMainValid"
                         formControlName="allowWhatsappReminders"
                         class="h-4 w-4 rounded border" />
                  <span class="text-sm">Permitir recordatorios por WhatsApp</span>
                </label>
              </div>

            </div>

            <!-- ADDRESS -->
            <div class="border-t pt-4">
              <h4 class="text-sm font-semibold text-slate-800">Dirección</h4>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">

                <!-- STATE -->
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Departamento</label>
                  <select formControlName="state"
                          class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="">-- Selecciona --</option>
                    <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
                  </select>
                </div>

                <!-- CITY REMOVED ✔ -->

                <!-- DISTRICT -->
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Zona / Distrito (opcional)</label>
                  <input formControlName="district"
                         type="text"
                         placeholder="Ej. Villa Fátima"
                         class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>

                <!-- ADDRESS LINE -->
                <div class="md:col-span-3">
                  <label class="block text-xs font-medium text-slate-700 mb-1">Dirección (línea)</label>
                  <input type="text"
                         formControlName="addressLine"
                         placeholder="Calle, número, referencia"
                         class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>

                <!-- POSTAL CODE -->
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Código postal (opcional)</label>
                  <input type="text"
                         formControlName="postalCode"
                         placeholder="Código postal"
                         class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>

              </div>
            </div>

            <!-- PHOTO -->
            <div class="border-t pt-4">
              <h4 class="text-sm font-semibold text-slate-800">Foto de perfil (opcional)</h4>

              <div class="mt-2 flex items-center gap-3">
                <input type="file" accept="image/*" (change)="onFileSelected($any($event.target).files)" />
                <div *ngIf="selectedPhotoName" class="text-sm text-slate-600">Archivo: {{ selectedPhotoName }}</div>
              </div>
            </div>

            <!-- EMERGENCY CONTACT -->
            <div class="border-t pt-4">
              <h4 class="text-sm font-semibold text-slate-800">Contacto de emergencia</h4>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Nombre</label>
                  <input formControlName="emergencyName"
                         type="text"
                         placeholder="Nombre (opcional)"
                         class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Relación</label>
                  <input formControlName="emergencyRelationship"
                         type="text"
                         placeholder="Ej. Madre"
                         class="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1">Teléfono contacto</label>

                  <div class="relative">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">+591</div>

                    <input type="tel"
                           [value]="emergencyPhoneDisplay"
                           (input)="onEmergencyPhoneInput($any($event.target).value)"
                           (blur)="onEmergencyPhoneBlur()"
                           placeholder="76543210"
                           class="w-full rounded-lg border px-3 py-2 pl-14 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>

                  <p *ngIf="emergencyPhoneInvalid && emergencyPhoneTouched" class="text-xs text-rose-600 mt-1">
                    {{ emergencyPhoneErrorText }}
                  </p>
                </div>

              </div>
            </div>

            <!-- ACTIONS -->
            <div class="pt-4 flex items-center justify-between">

              <span class="text-xs text-slate-500">
                Al crear este paciente se guardarán los datos proporcionados.
              </span>

              <div class="flex items-center gap-3">
                <button type="button"
                        (click)="backToPersonal()"
                        class="px-3 py-2 rounded-lg border text-sm">
                  Volver
                </button>

                <button type="submit"
                        [disabled]="submitDisabled"
                        class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60">
                  Crear paciente
                </button>
              </div>

            </div>

          </form>

        </div>
      </div>
    </div>
  `,
})
export class PatientCreateWizardPage implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private patientService = inject(PatientService);

  showContact = false;

  documentExample: string = '';

  personalForm = this.fb.group({
    givenName: ['', [Validators.required, Validators.minLength(2)]],
    familyName: ['', [Validators.required, Validators.minLength(2)]],
    documentType: [''],
    documentNumber: ['', [Validators.pattern(/^[0-9A-Za-z\-]*$/)]],
    birthDate: [null],
    sex: [''],
  });

  contactForm = this.fb.group({
    email: ['', [Validators.email]],
    phoneMobile: [''],
    phoneAlt: [''],
    allowEmailReminders: [false],
    allowWhatsappReminders: [false],
    state: [''],
    district: [''],
    addressLine: [''],
    postalCode: [''],
    emergencyName: [''],
    emergencyRelationship: [''],
    emergencyPhone: [''],
  });

  phoneMainDisplay = '';
  phoneAltDisplay = '';
  emergencyPhoneDisplay = '';

  departments = [
    'Beni','Chuquisaca','Cochabamba','La Paz','Oruro','Pando','Potosí','Santa Cruz','Tarija'
  ];

  selectedPhoto: File | null = null;
  selectedPhotoName: string | null = null;

  showConflictModal = false;
  conflictFieldLabel = '';
  conflictValue: string | null = null;
  conflictMessage: string | null = null;

  get givenName(): AbstractControl { return this.personalForm.get('givenName')!; }
  get familyName(): AbstractControl { return this.personalForm.get('familyName')!; }
  get documentNumber(): AbstractControl { return this.personalForm.get('documentNumber')!; }
  get email(): AbstractControl { return this.contactForm.get('email')!; }

  ngOnInit() {
    this.personalForm.get('documentType')?.valueChanges.subscribe(() => {
      this.updateDocumentExample();
    });
  }

  updateDocumentExample() {
    const type = this.personalForm.get('documentType')?.value;

    switch (type) {
      case 'CI':
        this.documentExample = 'Ej. 12345678';
        break;
      case 'PASSPORT':
        this.documentExample = 'Ej. PB1234567';
        break;
      case 'RUC':
        this.documentExample = 'Ej. 10203040';
        break;
      default:
        this.documentExample = '';
    }
  }

  // PHONE HELPERS ------------------------------------

  private digitsFrom(raw?: string): string {
    if (!raw) return '';
    const dig = raw.replace(/\D/g, '');
    return dig.startsWith('591') ? dig.substring(3).substring(0, 8) : dig.substring(0, 8);
  }

  onPhoneMainInput(raw: string) {
    const digits = this.digitsFrom(raw);
    this.phoneMainDisplay = digits || '';
    this.contactForm.get('phoneMobile')?.setValue(digits ? `+591${digits}` : '');
  }

  onPhoneMainBlur() {
    this.contactForm.get('phoneMobile')?.markAsTouched();
  }

  get phoneMainValid() {
    const v = this.contactForm.get('phoneMobile')?.value;
    return v && /^\+591\d{8}$/.test(v);
  }

  get phoneMainInvalid() {
    return !this.phoneMainValid && this.contactForm.get('phoneMobile')?.touched;
  }

  get phoneMainTouched() {
    return this.contactForm.get('phoneMobile')?.touched;
  }

  get phoneMainErrorText() {
    return 'Formato inválido. Debe tener 8 dígitos.';
  }

  // ALT PHONE
  onPhoneAltInput(raw: string) {
    const digits = this.digitsFrom(raw);
    this.phoneAltDisplay = digits || '';
    this.contactForm.get('phoneAlt')?.setValue(digits ? `+591${digits}` : '');
  }

  onPhoneAltBlur() {
    this.contactForm.get('phoneAlt')?.markAsTouched();
  }

  get phoneAltValid() {
    const v = this.contactForm.get('phoneAlt')?.value;
    return !v || /^\+591\d{8}$/.test(v);
  }

  get phoneAltInvalid() {
    return this.contactForm.get('phoneAlt')?.touched && !this.phoneAltValid;
  }

  get phoneAltTouched() {
    return this.contactForm.get('phoneAlt')?.touched;
  }

  get phoneAltErrorText() {
    return 'Formato inválido. Debe ser +591 y 8 dígitos.';
  }

  // EMERGENCY PHONE
  onEmergencyPhoneInput(raw: string) {
    const digits = this.digitsFrom(raw);
    this.emergencyPhoneDisplay = digits || '';
    this.contactForm.get('emergencyPhone')?.setValue(digits ? `+591${digits}` : '');
  }

  onEmergencyPhoneBlur() {
    this.contactForm.get('emergencyPhone')?.markAsTouched();
  }

  get emergencyPhoneValid() {
    const v = this.contactForm.get('emergencyPhone')?.value;
    return !v || /^\+591\d{8}$/.test(v);
  }

  get emergencyPhoneInvalid() {
    return this.contactForm.get('emergencyPhone')?.touched && !this.emergencyPhoneValid;
  }

  get emergencyPhoneTouched() {
    return this.contactForm.get('emergencyPhone')?.touched;
  }

  get emergencyPhoneErrorText() {
    return 'Formato inválido (+591 y 8 dígitos).';
  }

  // STEP FLOW -----------------------------------------

  goToContact() {
    if (this.personalForm.invalid) return;
    this.showContact = true;
  }

  backToPersonal() {
    this.showContact = false;
  }

  // FILE PICKER ---------------------------------------

  onFileSelected(list: FileList | null) {
    if (!list || list.length === 0) {
      this.selectedPhoto = null;
      this.selectedPhotoName = null;
      return;
    }
    this.selectedPhoto = list[0];
    this.selectedPhotoName = list[0].name;
  }

  // SUBMIT --------------------------------------------

  get submitDisabled() {
    return (
      this.personalForm.invalid ||
      !this.phoneMainValid ||
      !this.phoneAltValid ||
      !this.emergencyPhoneValid
    );
  }

  async submit() {
    this.personalForm.markAllAsTouched();
    this.contactForm.markAllAsTouched();

    if (this.personalForm.invalid || !this.phoneMainValid) return;

    const payload: any = {
      givenName: this.personalForm.get('givenName')?.value,
      familyName: this.personalForm.get('familyName')?.value,
      documentType: this.personalForm.get('documentType')?.value || null,
      documentNumber: this.personalForm.get('documentNumber')?.value || null,
      birthDate: this.personalForm.get('birthDate')?.value || null,
      sex: this.personalForm.get('sex')?.value || null,
      phoneMobile: this.contactForm.get('phoneMobile')?.value || null,
      phoneAlt: this.contactForm.get('phoneAlt')?.value || null,
      email: this.contactForm.get('email')?.value || null,
      allowEmailReminders: this.contactForm.get('allowEmailReminders')?.value,
      allowWhatsappReminders: this.contactForm.get('allowWhatsappReminders')?.value,
      state: this.contactForm.get('state')?.value || null,
      district: this.contactForm.get('district')?.value || null,
      addressLine: this.contactForm.get('addressLine')?.value || null,
      postalCode: this.contactForm.get('postalCode')?.value || null,
      country: 'BO',
      contacts: [],
    };

    const ename = this.contactForm.get('emergencyName')?.value;
    const erel = this.contactForm.get('emergencyRelationship')?.value;
    const ephone = this.contactForm.get('emergencyPhone')?.value;

    if (ename || ephone) {
      payload.contacts.push({
        name: ename || null,
        relationship: erel || null,
        telecom: ephone || null,
      });
    }

    try {
      if (this.selectedPhoto) {
        await this.patientService.createPatientWithPhoto(payload, this.selectedPhoto);
      } else {
        await this.patientService.createPatient(payload);
      }

      await this.router.navigateByUrl('/dashboard/pacientes', {
        state: { message: 'Paciente creado correctamente.' },
      });

    } catch (err: any) {
      console.error('Error creando paciente', err);
      alert(err?.error?.message || 'No se pudo crear el paciente.');
    }
  }

  // ERRORS ---------------------------------------------

  getGivenNameError() {
    if (this.givenName.hasError('required')) return 'Nombres obligatorios.';
    if (this.givenName.hasError('minlength')) return 'Mínimo 2 caracteres.';
    return '';
  }

  getFamilyNameError() {
    if (this.familyName.hasError('required')) return 'Apellidos obligatorios.';
    if (this.familyName.hasError('minlength')) return 'Mínimo 2 caracteres.';
    return '';
  }

  getDocumentNumberError() {
    if (this.documentNumber.hasError('pattern')) return 'Solo números, letras y guiones.';
    return '';
  }

  getEmailError() {
    if (this.email.hasError('email')) return 'Correo inválido.';
    return '';
  }

}
