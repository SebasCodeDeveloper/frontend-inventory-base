import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification';

declare var bootstrap: any;

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
  
onPasswordModalHidden() {
  if (this.notify.lastModalId) {
   
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Un delay milimétrico para que el DOM respire y asimile la limpieza
    setTimeout(() => {
      const modalElement = document.getElementById(this.notify.lastModalId!);
      if (modalElement) {
       
        const viejaInstance = bootstrap.Modal.getInstance(modalElement);
        if (viejaInstance) viejaInstance.dispose();

        
        const modalInstance = new bootstrap.Modal(modalElement, {
          backdrop: true,
          keyboard: true
        });
        modalInstance.show();
      }
      this.notify.lastModalId = null; 
    }, 50);
  }
}
}