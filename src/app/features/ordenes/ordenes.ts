import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderReportRs, GetOrderByEmailRq } from '../../core/models/order.model';
import { NotificationService } from '../../core/services/notification';
import { OrderService } from '../../core/services/order';
import { OrderDetailModalComponent } from '../../shared/components/order-detail-modal/order-detail-modal';

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderDetailModalComponent],
  templateUrl: './ordenes.html',
  styleUrl: './ordenes.scss',
})
export class Ordenes implements OnInit {
  listaOrdenes: OrderReportRs[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  ordenSeleccionada: OrderReportRs | null = null;
  emailBusqueda: string = '';

  constructor(
    private orderService: OrderService,
    public notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.isLoading = true;
    this.orderService.getOrdersReport().subscribe({
      next: (data) => {
        this.listaOrdenes = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error de comunicación con el servidor.';
        this.isLoading = false;
      },
    });
  }

  buscarPorEmail(): void {
    if (!this.emailBusqueda.trim()) {
      this.cargarOrdenes();
      return;
    }
    const request: GetOrderByEmailRq = { email: this.emailBusqueda.trim() };
    this.isLoading = true;
    this.orderService.getOrdersByEmail(request).subscribe({
      next: (data) => {
        this.listaOrdenes = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.notify.show('error', 'Orden', 'No se encontraron órdenes', err.error?.message);
        this.isLoading = false;
      },
    });
  }

  eliminarOrden(id: string): void {
    this.notify.askConfirmation(() => {
      this.orderService.eliminarOrden(id).subscribe({
        next: () => {
          this.notify.show('delete', 'Orden');
          this.cargarOrdenes();
        },
        error: (err) => {
          const backMsg = err.error?.message || 'No se pudo eliminar el registro.';

          let miniMensaje = '';
          const msgLower = backMsg.toLowerCase();

          if (msgLower.includes('pagad')) {
            miniMensaje = 'NO se pueden eliminar las órdenes pagadas';
          } else if (msgLower.includes('cancelad')) {
            miniMensaje = 'NO se pueden eliminar las órdenes canceladas';
          }

          this.notify.show('error', 'Orden', backMsg, miniMensaje);
        },
      });
    });
  }

  verDetalle(orden: OrderReportRs): void {
    this.ordenSeleccionada = orden;
  }

  getStatusStyles(status: string) {
    switch (status) {
      case 'PAID':
        return { background: 'rgba(39, 201, 63, 0.15)', color: '#1aab29' };
      case 'CREATED':
        return { background: 'rgba(0, 122, 255, 0.15)', color: '#007aff' };
      case 'CANCELLED':
        return { background: 'rgba(255, 59, 48, 0.15)', color: '#ff3b30' };
      default:
        return { background: 'rgba(142, 142, 147, 0.15)', color: '#8e8e93' };
    }
  }
}
