import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { GetUserByEmailRq, User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user';
import { FormsModule } from '@angular/forms';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { NotificationService } from '../../core/services/notification';
import { PaginationComponent } from '../../shared/components/pagination/pagination';

/**
 * Componente para la administración de usuarios.
 * Gestiona el listado, búsqueda por email y operaciones CRUD mediante formularios dinámicos.
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, FormsModule, PaginationComponent],
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
  //Vista de modal view
  isViewMode: boolean = false;

  //Configuración de campos para el formulario dinámico de usuarios
  paginaActual: number = 1;
  itemsPorPagina: number = 6;

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
      validators: [Validators.required, Validators.minLength(3)],
    },
    {
      name: 'email',
      label: 'EMAIL ADDRESS',
      type: 'email',
      placeholder: 'usuario@dominio.com',
      validators: [Validators.required, Validators.email],
    },
    {
      name: 'age',
      label: 'ASSIGNED AGE',
      type: 'number',
      placeholder: '00',
      validators: [Validators.required, Validators.min(1), Validators.max(120)],
    },
  ];
  constructor(
    private userService: UserService,
    public notify: NotificationService,
  ) {}

  /**
   * Este Getter es la clave: el HTML usará esto en el *ngFor
   */
  get usuariosPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.listaUsuarios.slice(inicio, fin);
  }

  onPageChange(nuevaPagina: number) {
    this.paginaActual = nuevaPagina;
  }
  
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
   * Activa el modo de solo lectura y carga el usuario.
   * Utilizado cuando el usuario desea consultar detalles sin modificar.
   */
  verUsuario(user: User): void {
    this.isViewMode = true;
    this.usuarioSeleccionado = { ...user };
  }

  /**
   * Desactiva el modo de lectura y carga el usuario para permitir su edición.
   */
  editarUsuario(user: User): void {
    this.isViewMode = false;
    this.usuarioSeleccionado = { ...user };
  }

  /**
   * Limpia el estado y desactiva el modo lectura para creación nueva.
   */
  prepararNuevoUsuario(): void {
    this.isViewMode = false;
    this.usuarioSeleccionado = null;
  }

  /**
   * Callback de éxito del formulario: Refresca la tabla y lanza notificación visual.
   */

onUserOperationSuccess() {
    const idEditado = this.usuarioSeleccionado ? this.usuarioSeleccionado.id : null;
    const action = idEditado ? 'update' : 'create';

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.listaUsuarios = data || [];

        if (idEditado) {
          this.usuarioSeleccionado = this.listaUsuarios.find(u => u.id === idEditado) || null;
        } else {
          this.usuarioSeleccionado = null;
        }

        this.notify.show(action, 'User');
      },
      error: (err) => {
        this.notify.show('error', 'User', 'Error al sincronizar los datos.');
      }
    });
  }

  /**
   * Consume el servicio para obtener todos los usuarios registrados.
   */
  cargarUsuarios(): void {
  this.isLoading = true;
  this.errorMessage = null;
  this.userService.getUsers().subscribe({
    next: (data) => {
      this.listaUsuarios = data || [];
      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      if (err.status !== 404) {
        this.errorMessage = 'No se pudo conectar con el servidor por favor intente más tarde o revise su conexión.';
      } else {
        this.listaUsuarios = [];
      }
    },
  });
}

  /**
   * Filtra la lista de usuarios por correo electrónico.
   * Si el campo está vacío, restaura el listado original.
   */
 buscarPorEmail(): void {
        this.paginaActual = 1;
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
 * Gestiona la eliminación de un usuario.
 * Replica la lógica de productos: si tiene órdenes, intenta borrar para capturar el error del back.
 * Si está limpio, pide confirmación.
 */
eliminarUsuario(usuario: User): void {

  const tieneOrdenes = (usuario.orders && usuario.orders.length > 0);

  if (tieneOrdenes) {
    this.userService.deleteUser(usuario.id).subscribe({
      error: (err) => {
        const backMsg = err.error?.message;
        this.notify.show('error', 'User', backMsg, 'No se pudo completar la acción');
      }
    });
    return;
  }

  // Si no tiene órdenes, procedemos con la confirmación visual
  this.notify.askConfirmation('delete', () => {
    this.isLoading = true;
    this.userService.deleteUser(usuario.id).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.notify.show('delete', 'User');
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        const backMsg = err.error?.message || 'Error al eliminar usuario.';
        this.notify.show('error', 'User', backMsg, 'No se pudo completar la acción');
      }
    });
  });
}
}