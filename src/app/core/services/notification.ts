import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

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
  
  public lastModalId: string | null = null;
  public isValidating: boolean = false;

  public confirmType: 'delete' | 'cancel' | 'pay' | 'update' | null = null;
  private pendingAction: (() => void) | null = null;
  public adminPasswordTemp: string = '';

  private cancelSource = new Subject<void>();
  cancel$ = this.cancelSource.asObservable();

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
      create: { title: 'Created', msg: `New ${entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase()} Successfully.`, icon: 'bi bi-check-all text-success' },
      update: { title: 'Updated', msg: `${entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase()} Updated Successfully. `, icon: 'bi bi-pencil-square text-primary' },
      delete: { title: 'Deleted', msg: `${entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase()} Deleted Successfully.`, icon: 'bi bi-trash3-fill text-danger' },
      error: { title: 'Error de conexión', msg: 'Please check the data', icon: 'bi bi-exclamation-octagon-fill text-warning' },
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
  askConfirmation(type: 'delete' | 'cancel' | 'pay' | 'update', callback: () => void) {
    this.confirmType = type;
    this.pendingAction = callback;
    
    const modalElement = document.getElementById('deleteConfirmModal');
    if (modalElement) { 
      this.prepareModalDepth(modalElement);
     const modalInstance = new bootstrap.Modal(modalElement, { backdrop: 'static' });
      modalInstance.show(); 
    }
  }

  /**
   * Ejecuta la acción guardada en 'askConfirmation' y cierra el modal.
   */
  public executeConfirmation() {
    if (this.pendingAction) {
  
      const actionToRun = this.pendingAction;
      this.pendingAction = null;
      
      actionToRun();
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

/**   * Solicita al usuario la contraseña maestra para validar acciones sensibles.
   * @param callback Función que recibe la contraseña ingresada por el usuario.
   */
askPassword(callback: (pass: string) => void) {
  this.pendingAction = () => {
    callback(this.adminPasswordTemp);
  };
  
  // Código para abrir el modal 'passwordModal' (el que ya tienes)
  const modalElement = document.getElementById('passwordModal');
  if (modalElement) {
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();
  }
}

  /**
   * Ejecuta la acción guardada en 'askPassword' con la contraseña ingresada y cierra el modal.
   * @param pass Contraseña ingresada por el usuario.
   */
public executePasswordConfirmation(pass: string) {
  this.adminPasswordTemp = pass;
  if (this.pendingAction) {
    // Limpia antes de ejecutar para permitir encadenar modales (password -> confirm).
    const actionToRun = this.pendingAction;
    this.pendingAction = null;
    actionToRun();

    const modalElement = document.getElementById('passwordModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    this.cleanupDOM();
  }
}

/** * Cancela cualquier acción pendiente de confirmación o validación de contraseña.
 * También emite un evento para que los componentes puedan reaccionar a la cancelación.
 */
notifyCancel() { 
    this.isValidating = false;
    this.cancelSource.next(); 
  }
  
  /**
   * Limpieza manual del DOM para evitar que el fondo oscuro se quede bloqueado.
   */
  private cleanupDOM() {
    setTimeout(() => {
      
      if (this.isValidating) return;
  
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