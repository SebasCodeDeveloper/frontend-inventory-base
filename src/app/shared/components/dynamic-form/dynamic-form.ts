import { Component, EventEmitter, OnDestroy, Output, Input, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dynamic-form.html',
  styleUrl: './dynamic-form.scss',
})
export class DynamicFormComponent implements OnDestroy, AfterViewInit {
  // Outputs para comunicar al padre cuando una operación fue exitosa o cuando se cancela la edición/creación
  @Output() operationSuccess = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

// Inputs para configurar el formulario dinámico
  @Input() title: string = 'Record';
  @Input() fields: any[] = []; 
  @Input() modalId: string = 'genericModal';
  
  // La función que guarda (viene del padre)
  @Input() saveAction!: (data: any, id?: any) => Observable<any>;

  form: FormGroup;
  backendErrors: string[] = [];
  id: any = null;
  isEditMode = false;

  private modalListener = () => this.ejecutarLimpiezaSilenciosa();

  // Este setter se encarga de cargar los datos en el formulario cuando se recibe un objeto para editar, o limpiar el formulario si se recibe null (para crear nuevo)
  @Input() set dataToEdit(data: any) {
    if (data) {
      this.id = data.id;
      this.isEditMode = true;
      this.form.patchValue(data);
    } else {
      this.id = null;
      this.isEditMode = false;
      this.form?.reset();
    }
  }

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({}); 
  }

  // En este método se crean los controles del formulario dinámicamente según los campos recibidos por input
  ngOnInit() {
    this.fields.forEach(field => {
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

  // Limpiamos el formulario y los errores cuando se cierra el modal para evitar que queden datos o mensajes de error al abrirlo nuevamente
  ngOnDestroy(): void {
    const modalElement = document.getElementById(this.modalId);
    if (modalElement) {
      modalElement.removeEventListener('hidden.bs.modal', this.modalListener);
    }
  }

// Este método se encarga de cerrar el modal y limpiar el formulario completamente (incluyendo errores) después de una operación exitosa
  resetFormTotal(): void {
  const closeBtn = document.querySelector(`#${this.modalId} [data-bs-dismiss="modal"]`) as HTMLElement;
  if (closeBtn) {
    closeBtn.click();
  }
}

// Este método se encarga de limpiar el formulario y los errores sin cerrar el modal (para casos como "Guardar y seguir editando")
  private ejecutarLimpiezaSilenciosa(): void {
    this.form.reset();
    this.backendErrors = [];
    this.id = null;
    this.isEditMode = false;
    this.onCancel.emit();
  }

  // Método que se ejecuta al enviar el formulario, se encarga de llamar a la función de guardado y manejar la respuesta
  onSubmit() {
    if (this.form.invalid) return
    this.backendErrors = [];
    this.saveAction(this.form.value, this.id).subscribe({
      next: () => {
        this.operationSuccess.emit();
        this.resetFormTotal();
      },
      error: (err) => this.handleBackendErrors(err),
    });
  }

  // Este método se encarga de interpretar los errores del backend y mostrarlos en el formulario
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
