import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderReportRs } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail-modal.html',
  styleUrl: './order-detail-modal.scss'
})
export class OrderDetailModalComponent {
  @Input() orden: OrderReportRs | null = null;
  @Output() actionCompleted = new EventEmitter<void>();

  constructor(
    private orderService: OrderService, 
    public notify: NotificationService
  ) {}

cancelar(): void {
  if (!this.orden) return;
  this.notify.askConfirmation(() => {
    this.orderService.cancelarOrden(this.orden!.orderId).subscribe({
      next: () => {
        this.notify.show('update', 'Orden');
        this.actionCompleted.emit();
      },
      error: (err) => {
        const backErrorMsg = err.error?.message || 'The operation could not be completed.';
        this.notify.show('error', 'Orden', backErrorMsg, 'System Error');
      }
    });
  });
}

//metodo para pagar la orden
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