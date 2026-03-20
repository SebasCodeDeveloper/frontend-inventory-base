import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { GetUserByEmailRq, User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user';
import { FormsModule } from '@angular/forms';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { NotificationService } from '../../core/services/notification';

/**
 * Componente para la administración de usuarios.
 * Gestiona el listado, búsqueda por email y operaciones CRUD mediante formularios dinámicos.
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
//Colección de usuarios registrados en el sistema
  listaUsuarios: User[] = [];
//Estado de carga para feedback visual en la UI 
  isLoading: boolean = false;
//Mensaje para mostrar errores de conexión o servidor en el template
  errorMessage: string | null = null;
//Usuario seleccionado para edición; null indica creación de un nuevo registro
  usuarioSeleccionado: User | null = null;
//Modelo vinculado al campo de búsqueda por correo
  emailBusqueda: string = '';

/**
   * Configuración de los campos del formulario dinámico.
   * Incluye validaciones de formato de email y rangos de edad.
   */
  userFields = [
    { 
      name: 'name', 
      label: 'FULL NAME', 
      type: 'text', 
      placeholder: 'Ej: Johan Peña',
      validators: [Validators.required, Validators.minLength(3)] 
    },
    { 
      name: 'email', 
      label: 'EMAIL ADDRESS', 
      type: 'email', 
      placeholder: 'usuario@dominio.com',
      validators: [Validators.required, Validators.email] 
    },
    { 
      name: 'age', 
      label: 'ASSIGNED AGE', 
      type: 'number', 
      placeholder: '00',
      validators: [Validators.required, Validators.min(1), Validators.max(120)] 
    }
  ];
  constructor(
    private userService: UserService,
    public notify: NotificationService 
  ) {}

  /**
   * Inicialización del componente: Solicita la lista inicial de usuarios.
   */
  ngOnInit(): void {
    this.cargarUsuarios();
  }

  /**
   * Determina si la acción del formulario debe ser de creación o actualización.
   * Se pasa como referencia al componente hijo 'DynamicFormComponent'.
   */
  saveUserAction = (data: any, id?: any) => {
    return id ? this.userService.updateUser(id, data) : this.userService.createUser(data);
  };

  /**
   * Limpia la selección para asegurar que el formulario abra campos vacíos.
   */
  prepararNuevoUsuario(): void {
    this.usuarioSeleccionado = null;
  }

  /**
   * Clona los datos del usuario seleccionado para edición.
   * Se usa el operador spread {...} para evitar mutaciones directas en la tabla antes de guardar.
   */
  editarUsuario(user: User): void {
    this.usuarioSeleccionado = { ...user };
  }

  /**
   * Callback de éxito del formulario: Refresca la tabla y lanza notificación visual.
   */
  onUserOperationSuccess() {
    const action = this.usuarioSeleccionado ? 'update' : 'create';
    this.cargarUsuarios(); 
    this.notify.show(action, 'User');
  }

/**
   * Consume el servicio para obtener todos los usuarios registrados.
   */
  cargarUsuarios(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.listaUsuarios = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo conectar con el servidor  .';
        this.isLoading = false;
      },
    });
  }

/**
   * Filtra la lista de usuarios por correo electrónico.
   * Si el campo está vacío, restaura el listado original.
   */
    buscarPorEmail(): void {
      if (!this.emailBusqueda.trim()) {
        this.cargarUsuarios();
        return;
      }
      const request: GetUserByEmailRq = { email: this.emailBusqueda.trim() };
      this.isLoading = true;
      this.userService.getByEmail(request).subscribe({
        next: (data) => {
          this.listaUsuarios = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.notify.show('error', 'User', err.error?.message, 'Verifique los datos ingresados');
          console.log(this.notify)
          this.isLoading = false;
        },
      });
    }

/**
   * Gestiona la eliminación de un usuario tras confirmación.
   * Maneja errores específicos de integridad (ej: usuario con órdenes asociadas).
   */
  eliminarUsuario(id: any): void {
    this.notify.askConfirmation(() => {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.notify.show('delete', 'User'); 
          this.cargarUsuarios(); 
        },
        error: (err) => {
          const backMsg = err.error?.message || 'No se pudo eliminar el registro.';
          this.notify.show('error', 'User', backMsg);

              this.notify.show('error', 'Orden', backMsg, 'No se puede eliminar el usuario porque tiene órdenes asociadas');
        },
      });
    });
  }
}