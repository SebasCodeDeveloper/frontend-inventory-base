import { Injectable } from '@angular/core';

declare var bootstrap: any;

/**
 * Servicio centralizado para la gestión de notificaciones y diálogos de confirmación.
 * Utiliza modales de Bootstrap para mostrar mensajes de éxito, error y confirmaciones de borrado.
 */
@Injectable({
  providedIn: 'root',
})
export class  NotificationService {
  public modalTitle = '';
  public modalMessage = ''; 
  public modalIcon = '';
  
  private pendingAction: (() => void) | null = null;

  /**
   * Dispara una notificación visual al usuario.
   * @param action Tipo de evento (success, create, update, delete, error).
   * @param entityName Nombre del módulo afectado (ej: 'User', 'Product').
   * @param customTitle (Opcional) Título personalizado para el modal.
   * @param customMsg (Opcional) Mensaje específico.
   */
  public show(
    action: 'success' | 'create' | 'update' | 'delete' | 'error', 
    entityName: string,
    customTitle?: string, 
    customMsg?: string    
  ) {
    const configs = {
      success: { title: 'Success', msg: 'Operation completed.', icon: 'bi bi-check-circle text-success' },
      create: { title: 'Created', msg: `New ${entityName.toLowerCase()} active.`, icon: 'bi bi-check-all text-success' },
      update: { title: 'Updated', msg: 'Changes synchronized.', icon: 'bi bi-pencil-square text-primary' },
      delete: { title: 'Deleted', msg: 'Record purged.', icon: 'bi bi-trash3-fill text-danger' },
      error: { title: 'Error de conexión', msg: 'The operation could not be completed.', icon: 'bi bi-exclamation-octagon-fill text-warning' },
    };

    const config = configs[action];
    this.modalTitle = customTitle || `${entityName} ${config.title}`;
    this.modalMessage = customMsg || config.msg;
    this.modalIcon = config.icon;

    // Lógica de visualización del Modal de Bootstrap
    const modalElement = document.getElementById('notificationModal');
    if (modalElement) {
      this.prepareModalDepth(modalElement);
      
      const modalInstance = new bootstrap.Modal(modalElement, { backdrop: true, keyboard: false });
      modalInstance.show();

      // Los errores permanecen más tiempo en pantalla (4s) que los éxitos (2.2s)
      const duration = action === 'error' ? 4000 : 2200;
      setTimeout(() => {
        modalInstance.hide();
        this.cleanupDOM();
      }, duration);
    }
  }

  /**
   * Abre un diálogo de confirmación antes de realizar una acción destructiva.
   * @param callback Función que se ejecutará si el usuario confirma.
   */
  public askConfirmation(callback: () => void) {
    this.pendingAction = callback;
    const modalElement = document.getElementById('deleteConfirmModal');
    
    if (modalElement) { 
      this.prepareModalDepth(modalElement);
      const modalInstance = new bootstrap.Modal(modalElement, { backdrop: true });
      modalInstance.show(); 
    }
  }

  /**
   * Ejecuta la acción guardada en 'askConfirmation' y cierra el modal.
   */
  public executeConfirmation() {
    if (this.pendingAction) {
      this.pendingAction(); 
      this.pendingAction = null;       
      const modalElement = document.getElementById('deleteConfirmModal');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide();
      this.cleanupDOM();
    }
  }

  /**
   * Ajusta la jerarquía del DOM y el z-index para que el modal aparezca al frente.
   */
  private prepareModalDepth(element: HTMLElement) {
    document.body.appendChild(element);
    element.style.zIndex = '10001';
    
    // Ajuste inmediato del backdrop después de que Bootstrap lo crea
    setTimeout(() => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      if (backdrops.length > 0) {
        (backdrops[backdrops.length - 1] as HTMLElement).style.zIndex = '10000';
      }
    }, 10);
  }

  /**
   * Limpieza manual del DOM para evitar que el fondo oscuro se quede bloqueado.
   */
  private cleanupDOM() {
    setTimeout(() => {
      if (document.querySelectorAll('.modal.show').length === 0) {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = ''; 
      }
    }, 400);
  }
}