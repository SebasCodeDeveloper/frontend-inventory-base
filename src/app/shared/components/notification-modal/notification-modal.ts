import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification';

/**
 * Componete de  notificaciones globales:
 * Actúa como el contenedor visual (Modal/Toast) para todas las alertas del sistema.
 * Centraliza la visualización de mensajes de éxito, error, eliminación y advertencia.
 */
@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-modal.html',
  styleUrl: './notification-modal.scss',
})
export class NotificationModalComponent {
  
 /**
   * INYECCIÓN PÚBLICA:
   * - notify.isVisible: Para mostrar/ocultar el modal.
   * - notify.type: Para cambiar colores/iconos según el tipo de alerta.
   * - notify.message: El texto principal de la notificación.
   */
  constructor(public notify: NotificationService) {}
}