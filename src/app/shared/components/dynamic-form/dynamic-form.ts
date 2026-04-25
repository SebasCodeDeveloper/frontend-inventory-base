import { Component, EventEmitter, OnDestroy, Output, Input, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

/**
 * COMPONENTE NÚCLEO: Formulario Dinámico Universal.
 * Se encarga de construir campos en tiempo real, gestionar validaciones,
 * capturar errores del Backend y controlar el estado de los modales de Bootstrap.
 */
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-form.html',
  styleUrl: './dynamic-form.scss',
})
export class DynamicFormComponent implements OnDestroy, AfterViewInit {
  // Notifica al componente padre que el guardado fue exitoso para refrescar tablas
  @Output() operationSuccess = new EventEmitter<void>();
  // Notifica cuando el usuario cancela o cierra el modal
  @Output() onCancel = new EventEmitter<void>();

  // Título dinámico (Ej: 'User', 'Product')
  @Input() title: string = 'Record';
  // Array de objetos que definen la estructura del formulario (nombre, tipo, validadores)
  @Input() fields: any[] = [];
  // ID del modal en el DOM para poder suscribirse a sus eventos de cierre
  @Input() modalId: string = 'genericModal';

  //Flag para mostrar el spinner de carga en la UI
  isLoading: boolean = false;

  /**
   * Setter y Getter para isReadOnly:
   * Obliga a habilitar/deshabilitar el formulario en tiempo real 
   * cuando el padre cambia el modo.
   */
  private _isReadOnly: boolean = false;
  @Input() set isReadOnly(value: boolean) {
    this._isReadOnly = value;
    if (this.form) {
      value ? this.form.disable() : this.form.enable();
    }
  }
  get isReadOnly(): boolean {
    return this._isReadOnly;
  }

  /** * REFERENCIA DE FUNCIÓN: Recibe una función del padre (saveUserAction o saveProductAction)
   * que retorna un Observable. Esto permite que el formulario sea agnóstico a los datos.
   */
  @Input() saveAction!: (data: any, id?: any) => Observable<any>;

  form: FormGroup;
  // Almacena mensajes de error procesados que vienen del servidor (API)
  backendErrors: string[] = [];
  // ID del registro actual; si existe, el formulario entra en 'Modo Edición'
  id: any = null;
  isEditMode = false;

  // Referencia a la función de limpieza para poder remover el listener correctamente
  private modalListener = () => this.ejecutarLimpiezaSilenciosa();

  /**
   * SETTER INTELIGENTE: Detecta cambios en los datos a editar.
   * Si recibe 'data', rellena el formulario automáticamente (patchValue).
   * Si recibe 'null', resetea el formulario para una nueva creación.
   */
  @Input() set dataToEdit(data: any) {
    if (data) {
      this.id = data.id;
      this.isEditMode = true;
      this.form.patchValue(data);
      this.isReadOnly ? this.form.disable() : this.form.enable();
    } else {
      this.id = null;
      this.isEditMode = false;
      this.form?.reset();
      this.form?.enable();
    }
  }

  /**
   * Construye los controles del Reactive Form basándose 
   * en la configuración recibida en el Input 'fields'.
   */
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  /**
   * Suscribe el componente al evento 'hidden.bs.modal' de Bootstrap.
   * Esto asegura que si el usuario cierra el modal con la tecla 'Esc' o clic fuera,
   * el formulario se limpie automáticamente.
   */
  ngOnInit() {
    this.fields.forEach((field) => {
      this.form.addControl(field.name, this.fb.control('', field.validators));
    });
  }

  // Agregamos un listener al modal para limpiar el formulario cada vez que se cierre, evitando que queden datos o errores al abrirlo nuevamente
  ngAfterViewInit() {
    const modalElement = document.getElementById(this.modalId);
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', this.modalListener);
    }
  }

  /**
   * Elimina el listener del DOM para evitar fugas de memoria (Memory Leaks).
   */
  ngOnDestroy(): void {
    const modalElement = document.getElementById(this.modalId);
    if (modalElement) {
      modalElement.removeEventListener('hidden.bs.modal', this.modalListener);
    }
  }

  /**
   * Simula un clic en el botón de cierre del modal programáticamente.
   */
  resetFormTotal(): void {
    const closeBtn = document.querySelector(
      `#${this.modalId} [data-bs-dismiss="modal"]`,
    ) as HTMLElement;
    if (closeBtn) {
      closeBtn.click();
    }
  }

  /**
   * Lógica interna para dejar el componente en su estado inicial (sin errores ni IDs).
   */
  private ejecutarLimpiezaSilenciosa(): void {
    this.form.reset();
    this.form.enable(); 
    this.backendErrors = [];
    this.id = null;
    this.isEditMode = false;
    this.onCancel.emit();
  }

  /**
   * Envío de Formulario: Valida, limpia errores previos y ejecuta la 'saveAction'.
   * Maneja el éxito cerrando el modal y el error procesando la respuesta de la API.
   */
  onSubmit() {
    if (this.form.invalid) return;
    this.backendErrors = [];
    this.saveAction(this.form.value, this.id).subscribe({
      next: () => {
        this.operationSuccess.emit();
        this.isLoading = false;
        this.resetFormTotal();
      },
      error: (err) => this.handleBackendErrors(err),
    });
  }

  /**
   * Interpreta diferentes formatos de error del Backend.
   * Maneja tanto strings simples como arrays de mensajes (típicos de NestJS/class-validator).
   */
  private handleBackendErrors(err: any) {
    if (err.error) {
      const body = err.error;
      if (body.message) {
        this.backendErrors = Array.isArray(body.message) ? body.message : [body.message];
      } else if (body.errors && Array.isArray(body.errors)) {
        this.backendErrors = body.errors;
      } else {
        this.backendErrors = ['Error de validación en el servidor.'];
      }
    } else {
      this.backendErrors = ['No se pudo obtener respuesta del servidor.'];
    }
  }
}
