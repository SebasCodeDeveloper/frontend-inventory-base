import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderReportRs, GetOrderByEmailRq, OrderStatus } from '../../core/models/order.model';
import { NotificationService } from '../../core/services/notification';
import { OrderService } from '../../core/services/order';
import { OrderDetailModalComponent } from '../../shared/components/order-detail-modal/order-detail-modal';
import { OrderFormModalComponent } from '../../shared/components/order-form-modal/order-form-modal';
import { PaginationComponent } from '../../shared/components/pagination/pagination';

// Declaración necesaria para que TypeScript reconozca Bootstrap
declare var bootstrap: any;

/**
 * Componente principal para la gestión y visualización de órdenes.
 * Implementa lógica de filtrado por email y acciones de control de estado.
 */
@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderDetailModalComponent,
    OrderFormModalComponent,
    PaginationComponent,
  ],
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

  //Configuración de campos para el formulario dinámico de usuarios
  paginaActual: number = 1;
  itemsPorPagina: number = 6;

  // Lista de estados disponibles para el dropdown, se usa en el template para generar opciones dinámicamente
  public readonly estadosDisponibles = ['CREATED', 'IN_PROGRESS', 'FINISHED', 'PAID', 'CANCELLED'];
  estadoHover: string | null = null;

  constructor(
    private orderService: OrderService,
    public notify: NotificationService,
  ) {}

  /**
   * Este Getter es la clave: el HTML usará esto en el *ngFor
   */
  get ordenesPaginadas() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.listaOrdenes.slice(inicio, fin);
  }

  onPageChange(nuevaPagina: number) {
    this.paginaActual = nuevaPagina;
  }

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
          this.errorMessage =
            'No se pudo conectar con el servidor por favor intente más tarde o revise su conexión.';
        } else {
          this.listaOrdenes = [];
        }
      },
    });
  }

  /**
   * Filtra la lista de ordenes  por correo electrónico, numero o nombre.
   * Si el campo está vacío, restaura el listado original.
   */
buscarOrdenes(): void {
  this.paginaActual = 1;
  
  const valorBusqueda = this.emailBusqueda.trim();

  if (!valorBusqueda) {
    this.cargarOrdenes();
    return;
  }

  const request = {} as GetOrderByEmailRq;

  if (valorBusqueda.includes('@')) {
    request.email = valorBusqueda;
  } else if (/^\d+$/.test(valorBusqueda)) {
    request.numero = valorBusqueda;
  } else {
    request.name = valorBusqueda;
  }

  this.isLoading = true;

  this.orderService.getOrdersByCriteria(request).subscribe({
    next: (data) => {
      this.listaOrdenes = data;
      this.isLoading = false;
    },
    error: (err) => {
      this.notify.show(
        'error', 
        'Orden', 
        err.error?.message || 'Error al realizar la búsqueda', 
        'Verificar los datos ingresados.'
      );
      this.isLoading = false;
    },
  });
}

  /**
   * Procesa la eliminación de una orden previa confirmación del usuario.
   * Contiene lógica de validación para estados restringidos (PAGADO/CANCELADO).
   */
  eliminarOrden(id: string): void {
    this.notify.askConfirmation('delete', () => {
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
   * Abre el modal de detalle asegurando limpieza previa de instancias.
   */
  abrirDetalleModal(delay: number = 0) {
    setTimeout(() => {
      const modalElement = document.getElementById('orderDetailModal');

      if (!modalElement) return;

      const existingModal = bootstrap.Modal.getInstance(modalElement);

      if (existingModal) {
        existingModal.dispose();
      }

      const modalInstance = new bootstrap.Modal(modalElement, { backdrop: 'static', keyboard: false,});
      
      modalInstance.show();
    }, delay);
  }

  /**
   * Procesa el guardado y gestiona la transición de modales.
   */
  onOrderSaved(): void {
    const idEditado = this.orderFormModal?.editMode ? this.ordenSeleccionada?.orderId : null;
    this.isLoading = true;

    this.orderService.getOrdersReport().subscribe({
      next: async (data) => {
        this.listaOrdenes = data || [];
        this.isLoading = false;

        if (idEditado) {
          this.ordenSeleccionada = this.listaOrdenes.find((o) => o.orderId === idEditado) || null;
        }
      },
      error: () => {
        this.isLoading = false;
        this.notify.show('error', 'Error', 'No se pudieron actualizar los datos.');
      },
    });
  }

  /**
   * Maneja el cambio de estado desde el dropdown en la tabla.
   * Contiene lógica para estados con flujos especiales (Pago/Cancelación).
   * Para otros cambios, solicita confirmación antes de aplicar el cambio.
   */
  cambiarEstado(order: OrderReportRs, event: any): void {
    const nuevoEstado = event.target.value;
    if (nuevoEstado === order.status) return;

    // Casos de Pago y Cancelación se mantienen con su propio flujo
    if (nuevoEstado === 'PAID') {
      this.ordenSeleccionada = order;
      this.pagar();
      return;
    }
    if (nuevoEstado === 'CANCELLED') {
      this.ordenSeleccionada = order;
      this.cancelar();
      return;
    }

    this.notify.askConfirmation('update', () => {
      this.orderService.updateOrderStatus(order.orderId, nuevoEstado).subscribe({
        next: () => {
          order.status = nuevoEstado;
          const index = this.listaOrdenes.findIndex((o) => o.orderId === order.orderId);
          if (index !== -1) {
            this.listaOrdenes[index] = { ...order };
          }

          if (nuevoEstado === 'FINISHED') {
            this.notify.show('success', 'Success', `Orden completado con éxito.`);
          } else {
            this.notify.show(
              'update',
              'Orden Actualizada',
              `El estado ha cambiado correctamente a ${nuevoEstado}.`,
              'Cambio aplicado',
            );
          }
        },
        error: (err) => {
          this.cargarOrdenes();
          this.notify.show('error', 'Seguridad', err.error?.message);
        },
      });
    });
  }

  /**
   * Procesa la transacción de pago de la orden actual.
   * Cambia el estado de la orden en el backend y notifica el resultado.
   */
  pagar(): void {
    if (!this.ordenSeleccionada) return;

    this.notify.askConfirmation('pay', () => {
      this.orderService.pagarOrden(this.ordenSeleccionada!.orderId).subscribe({
        next: () => {
          this.ordenSeleccionada!.status = OrderStatus.PAID;
          this.notify.show('success', 'Orden Pagada', 'La transacción se completó con éxito');
        },
        error: (err) => {
          this.notify.show('error', 'Error', err.error?.message);
        },
      });
    });
  }

  /**
   * Ejecuta el flujo de cancelación de una orden.
   * Solicita confirmación al usuario antes de proceder con la reversión en el servidor.
   */
  cancelar(): void {
    if (!this.ordenSeleccionada) return;

    this.notify.askConfirmation('cancel', () => {
      this.orderService.cancelarOrden(this.ordenSeleccionada!.orderId).subscribe({
        next: () => {
          this.ordenSeleccionada!.status = OrderStatus.CANCELLED;
          this.notify.show('success', 'Orden Cancelada', 'La orden ha sido anulada correctamente');
        },
        error: (err) => {
          this.notify.show('error', 'Error', err.error?.message);
        },
      });
    });
  }

  /**
   * Genera dinámicamente el estilo CSS (Glassmorphism) para los badges de estado.
   * @param status Estado de la orden (PAID, CREATED, CANCELLED).
   */
  getStatusStyles(status: string) {
    switch (status) {
      case 'PAID':
        return { background: 'rgba(39, 201, 63, 0.23)', color: '#059c14' };
      case 'CREATED':
        return { background: 'rgba(0, 123, 255, 0.23)', color: '#007bff' };
      case 'IN_PROGRESS':
        return { background: 'rgba(255, 149, 0, 0.23)', color: '#ff9500' };
      case 'FINISHED':
        return { background: 'rgba(175, 82, 222, 0.23)', color: '#aa00ff' };
      case 'CANCELLED':
        return { background: 'rgba(255, 58, 48, 0.23)', color: '#ff0d00' };
      default:
        return { background: 'rgba(142, 142, 147, 0.23)', color: '#8e8e93' };
    }
  }
}
