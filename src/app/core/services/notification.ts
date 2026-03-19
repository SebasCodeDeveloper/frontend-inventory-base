import { Injectable } from '@angular/core';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  public modalTitle = '';
  public modalMessage = ''; 
  public modalIcon = '';
  
  private pendingAction: (() => void) | null = null;

  public show(
    action: 'success' | 'create' | 'update' | 'delete' | 'error', 
    entityName: string,
    customTitle?: string, // Se usará para el mensaje principal (grande)
    customMsg?: string    // Se usará para el mensaje secundario (pequeño)
  ) {
    const configs = {
      success: { title: 'Success', msg: 'Operation completed.', icon: 'bi bi-check-circle text-success' },
      create: { title: 'Created', msg: `New ${entityName.toLowerCase()} active.`, icon: 'bi bi-check-all text-success' },
      update: { title: 'Updated', msg: 'Changes synchronized.', icon: 'bi bi-pencil-square text-primary' },
      delete: { title: 'Deleted', msg: 'Record purged.', icon: 'bi bi-trash3-fill text-danger' 
},
      error: { title: 'System Error', msg: 'The operation could not be completed.', icon: 'bi bi-exclamation-octagon-fill text-warning' },
    };

    const config = configs[action];

    // Ajuste para que el mensaje del BACK sea el GRANDE (modalTitle)
    this.modalTitle = customTitle || `${entityName} ${config.title}`;
    this.modalMessage = customMsg || config.msg;
    this.modalIcon = config.icon;

    const modalElement = document.getElementById('notificationModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false });
      modalInstance.show();

      const duration = action === 'error' ? 4000 : 2200;
      setTimeout(() => {
        modalInstance.hide();
        setTimeout(() => {
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) backdrop.remove();
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }, 400);
      }, duration);
    }
  }

  public askConfirmation(callback: () => void) {
    this.pendingAction = callback;
    const modalElement = document.getElementById('deleteConfirmModal');
    if (modalElement) { new bootstrap.Modal(modalElement).show(); }
  }

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