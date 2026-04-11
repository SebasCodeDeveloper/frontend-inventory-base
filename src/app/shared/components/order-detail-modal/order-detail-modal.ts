import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderReportRs } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order';
import { NotificationService } from '../../../core/services/notification';

/**
 * Componente encargado de visualizar el desglose detallado de una orden.
 * Permite realizar acciones de gestión como cancelación, pago y solicitud de edición.
 */
@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail-modal.html',
  styleUrl: './order-detail-modal.scss'
})
export class OrderDetailModalComponent {
  
  // Recibe la orden seleccionada desde el componente padre
  @Input() orden: OrderReportRs | null = null;

  // Notifica al padre que se realizó una acción (pago/cancelación) para refrescar la lista
  @Output() actionCompleted = new EventEmitter<void>();

  // Emite la orden actual al padre para que este abra el modal de edición
  @Output() editRequested = new EventEmitter<OrderReportRs>();
  
  constructor(
    private orderService: OrderService, 
    public notify: NotificationService
  ) {}

  /**
   * Ejecuta el flujo de cancelación de una orden.
   * Solicita confirmación al usuario antes de proceder con la reversión en el servidor.
   */
  cancelar(): void {
    if (!this.orden) return;

    // Solicita confirmación visual mediante el servicio de notificaciones
    this.notify.askConfirmation(() => {
      this.orderService.cancelarOrden(this.orden!.orderId).subscribe({
        next: () => {
          this.notify.show('update', 'Orden'); 
          this.actionCompleted.emit();        
        },
        error: (err) => {
          const backErrorMsg = err.error?.message;
          this.notify.show('error', 'Orden', backErrorMsg, 'No se pudo completar la acción');
        }
      });
    });
  }

  /**
   * Notifica al componente padre que el usuario desea modificar la orden actual.
   * Envía el objeto de la orden completa como payload.
   */
  solicitarEdicion(): void {
    if (this.orden) {
      this.editRequested.emit(this.orden);
    }
  }

  /**
   * Procesa la transacción de pago de la orden actual.
   * Cambia el estado de la orden en el backend y notifica el resultado.
   */
  pagar(): void {
    if (!this.orden) return;

    this.orderService.pagarOrden(this.orden.orderId).subscribe({
      next: () => {
        this.notify.show('success', 'Orden'); 
        this.actionCompleted.emit();     
      },
      error: (err) => {
        const msg = err.error?.message || 'Transaction failed.';
        this.notify.show('error', 'Orden', undefined, msg);
      }
    });
  }
}