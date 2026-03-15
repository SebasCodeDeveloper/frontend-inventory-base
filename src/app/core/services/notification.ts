import { Injectable } from '@angular/core';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  public modalTitle = '';
  public modalMessage = '';
  public modalIcon = '';
  
// Variable para almacenar la acción pendiente de confirmación
  private pendingAction: (() => void) | null = null;
// Método para mostrar el modal de notificación con diferentes configuraciones según la acción realizada
  public show(action: 'create' | 'update' | 'delete' | 'error', entityName: string) {
    const configs = {
      create: {
        title: 'Created',
        msg: `The new ${entityName.toLowerCase()} is now active.`,
        icon: 'bi bi-check-all text-success',
      },
      update: {
        title: 'Updated',
        msg: 'All technical changes were synchronized.',
        icon: 'bi bi-pencil-square text-primary',
      },
      delete: {
        title: 'Deleted',
        msg: 'The record has been purged from the system.',
        icon: 'bi bi-trash3-fill text-danger',
      },
      error: {
        title: 'System Error',
        msg: 'The operation could not be completed.',
        icon: 'bi bi-exclamation-octagon-fill text-warning',
      },
    };
// Configuramos el contenido del modal según la acción y el nombre de la entidad
    const config = configs[action];
    this.modalTitle = `${entityName} ${config.title}`;
    this.modalMessage = config.msg;
    this.modalIcon = config.icon;

    // Obtenemos el elemento del modal y lo configuramos para que no se cierre al hacer clic fuera o presionar Esc, y luego lo mostramos
    const modalElement = document.getElementById('notificationModal');

    // Configuramos el modal para que no se cierre al hacer clic fuera o presionar Esc, y lo mostramos
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false,
      });

      modalInstance.show();{  }


      setTimeout(() => {
        modalInstance.hide();
        setTimeout(() => {
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) backdrop.remove();
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }, 400);
      }, 2200);
    }
  }

// Método para mostrar el modal de confirmación de eliminación y guardar la acción a ejecutar si se confirma
  public askConfirmation(callback: () => void) {
    this.pendingAction = callback;
    const modalElement = document.getElementById('deleteConfirmModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

// Método que se llama cuando el usuario confirma la eliminación en el modal
  public executeConfirmation() {
    if (this.pendingAction) {
      this.pendingAction(); 
      this.pendingAction = null;       
      const modalElement = document.getElementById('deleteConfirmModal');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide();
    }
  }
}