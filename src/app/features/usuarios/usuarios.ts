import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  listaUsuarios: User[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  usuarioSeleccionado: User | null = null;

  // Definimos la estructura de los campos del formulario dinámico
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

  // Inyectamos los servicios necesarios: UserService para operaciones CRUD y NotificationService para mostrar mensajes al usuario
  constructor(
    private userService: UserService,
    public notify: NotificationService 
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  saveUserAction = (data: any, id?: any) => {
    return id ? this.userService.updateUser(id, data) : this.userService.createUser(data);
  };

  prepararNuevoUsuario(): void {
    this.usuarioSeleccionado = null;
  }

  editarUsuario(user: User): void {
    this.usuarioSeleccionado = { ...user };
  }

  onUserOperationSuccess() {
    const action = this.usuarioSeleccionado ? 'update' : 'create';
    this.cargarUsuarios(); 
    this.notify.show(action, 'User');
  }

  // Función para cargar la lista de usuarios desde el backend
  cargarUsuarios(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.listaUsuarios = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo conectar con el servidor Backend.';
        this.isLoading = false;
      },
    });
  }

// Función para eliminar un usuario, mostrando primero un modal de confirmación
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

              this.notify.show('error', 'Orden', backMsg, 'No se pudo eliminar el usuario porque tiene órdenes asociadas');
        },
      });
    });
  }
}