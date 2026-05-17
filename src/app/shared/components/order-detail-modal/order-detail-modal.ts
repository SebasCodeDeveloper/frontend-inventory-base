import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderReportRs } from '../../../core/models/order.model';

/**
 * Componente encargado de visualizar el desglose detallado de una orden.
 * Permite realizar acciones de gestión como cancelación, pago y solicitud de edición.
 */
@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail-modal.html',
  styleUrl: './order-detail-modal.scss',
})
export class OrderDetailModalComponent {

  // Recibe la orden seleccionada desde el componente padre
  @Input() orden: OrderReportRs | null = null;

  // Emite la orden actual al padre para que este abra el modal de edición
  @Output() verDetalle = new EventEmitter<OrderReportRs>();

  constructor(
  ) {}
}
