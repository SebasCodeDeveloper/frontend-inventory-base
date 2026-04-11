import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderReportRs, GetOrderByEmailRq } from '../../core/models/order.model';
import { NotificationService } from '../../core/services/notification';
import { OrderService } from '../../core/services/order';
import { OrderDetailModalComponent } from '../../shared/components/order-detail-modal/order-detail-modal';
import { OrderFormModalComponent } from '../../shared/components/order-form-modal/order-form-modal';

/**
 * Componente principal para la gestión y visualización de órdenes.
 * Implementa lógica de filtrado por email y acciones de control de estado.
 */
@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderDetailModalComponent, OrderFormModalComponent],
  templateUrl: './ordenes.html',
  styleUrl: './ordenes.scss',
})
export class Ordenes implements OnInit {

// Referencia al componente del formulario para poder manipularlo desde aquí
@ViewChild('orderFormModal') orderFormModal!: OrderFormModalComponent;

  //Listado de órdenes obtenidas desde el servidor
  listaOrdenes: OrderReportRs[] = [];
//Flag para mostrar el spinner de carga en la UI
  isLoading: boolean = false;
//Almacena mensajes de error para alertas rápidas en el template
  errorMessage: string | null = null;
//Orden seleccionada para ser enviada al modal de detalle
  ordenSeleccionada: OrderReportRs | null = null;
//Variable vinculada al input de búsqueda (Two-way binding)
  emailBusqueda: string = '';

  constructor(
    private orderService: OrderService,
    public notify: NotificationService,
  ) {}

  /**
   * Ciclo de vida: Carga inicial de datos al montar el componente.
   */
  ngOnInit(): void {
    this.cargarOrdenes();
  }

  /**
   * Recupera todas las órdenes (Reporte Global).
   */
cargarOrdenes(): void {
    this.isLoading = true;
    this.errorMessage = null; 
    this.orderService.getOrdersReport().subscribe({
      next: (data) => {
        this.listaOrdenes = data || []; 
        this.isLoading = false;
      },

      error: (err) => {
        this.isLoading = false;
        if (err.status !== 404) {
          this.errorMessage = 'No se pudo conectar con el servidor por favor intente más tarde o revise su conexión.';
        } else {
          this.listaOrdenes = []; 
        }
      },
    });
  }

  /**
   * Realiza una búsqueda filtrada. Si el campo está vacío, restaura la lista completa.
   */
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
        this.notify.show('error', 'Orden', err.error?.message, 'Verificarlos datos ingresados.');
        this.isLoading = false;
      },
    });
  }

  /**
   * Procesa la eliminación de una orden previa confirmación del usuario.
   * Contiene lógica de validación para estados restringidos (PAGADO/CANCELADO).
   */
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

  /**
   * Asigna la orden actual para que el @Input del modal la reciba y se abra.
   */
  verDetalle(orden: OrderReportRs): void {
    this.ordenSeleccionada = orden;
  }

  /**
   * Abre el modal de edición con los datos de la orden seleccionada.
   * El modal se encargará de diferenciar entre modo edición y creación.
   * @param orden 
   */
  abrirEdicion(orden: OrderReportRs): void {
    this.orderFormModal.patchData(orden);
    const modalElement = document.getElementById('orderCreateModal');
    if (modalElement) {
      const modalInstance = (window as any).bootstrap.Modal.getOrCreateInstance(modalElement);
      modalInstance.show();
    }
  }

  /**
   * Genera dinámicamente el estilo CSS (Glassmorphism) para los badges de estado.
   * @param status Estado de la orden (PAID, CREATED, CANCELLED).
   */
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
