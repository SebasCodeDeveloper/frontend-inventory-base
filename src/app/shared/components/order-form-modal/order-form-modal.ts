import { Component, EventEmitter, Output, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms'; 
import { OrderService } from '../../../core/services/order';
import { NotificationService } from '../../../core/services/notification';
import { ProductService } from '../../../core/services/product';
import { OrderRq, OrderReportRs, JobCatalog } from '../../../core/models/order.model';
import { UserService } from '../../../core/services/user';
import { JobCatalogService } from '../../../core/services/job-catalog';

declare var bootstrap: any;

@Component({
  selector: 'app-order-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-form-modal.html',
  styleUrl: './order-form-modal.scss',
})
export class OrderFormModalComponent implements OnInit {
  
  // Notifica al componente padre para refrescar la tabla principal tras una operación exitosa
  @Output() orderCreated = new EventEmitter<void>();


  // Referencias al DOM para manipular el Modal de Bootstrap y el estado del formulario
  @ViewChild('orderFormModal') modalElement!: ElementRef;
  @ViewChild('orderForm') orderForm!: NgForm;

  // Estados de la interfaz
  isLoading: boolean = false;
  editMode: boolean = false;
  orderId: string | null = null;
  errorMessage: string | null = null;

  // Datos operativos: Carrito temporal, catálogo de productos y base de datos de correos
  email: string | null = null;
  carrito: any[] = [];
  productosCatalogo: any[] = [];
  listaCorreos: string[] = [];

  // Catálogo y Carrito temporal para DETALLES DEL TRABAJO (Mano de Obra)
  catalogoTrabajos: JobCatalog[] = [];
  carritoTrabajos: any[] = [];
  editandoIndex: number | null = null;

  // Modelo para la entrada de nuevos productos al carrito
  nuevoItem = {
    productName: '',
    quantity: 1,
    unitPrice: 0 
  };

  // Modelo para la entrada de nuevos trabajos en caliente
  nuevoTrabajo = {
    jobName: '',
    price: 0
  };

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private userService: UserService, 
    private jobCatalogService: JobCatalogService,
    public notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarUsuariosRegistrados(); 
    this.cargarCatalogoTrabajos(); 
  }

  /**
   * Carga los datos de una orden existente para su edición
   * @param order Objeto con la información de la orden a editar
   */
  public patchData(order: OrderReportRs): void {
    this.editMode = true;
    this.orderId = order.orderId;
    this.email = order.email;
    
    // Mapeo de productos existentes
    this.carrito = order.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    // Mapeo de trabajos existentes en caso de edición
    this.carritoTrabajos = order.jobs ? order.jobs.map(job => ({
      jobName: job.jobName,
      price: job.price
    })) : [];
  }

  /**
   * Calcula el total acumulado de la venta actual (Productos + Mano de Obra)
   */
  get totalVenta(): number {
    const totalProductos = this.carrito.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const totalTrabajos = this.carritoTrabajos.reduce((acc, job) => acc + job.price, 0);
    return totalProductos + totalTrabajos;
  }

  /**
   * Obtiene los productos disponibles desde el backend
   */
  cargarCatalogo(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.productosCatalogo = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo conectar con el servidor por favor intente más tarde.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Carga la lista de correos electrónicos de usuarios registrados para el autocompletado/validación
   */
  cargarUsuariosRegistrados(): void {
    this.userService.getUsers().subscribe({
      next: (usuarios) => {
        this.listaCorreos = usuarios.map(u => u.email);
      },
      error: () => console.error('Error al cargar correos de usuarios')
    });
  }

  /**
   * Carga el catálogo de trabajos aprendidos por el sistema
   */
  cargarCatalogoTrabajos(): void {
    this.jobCatalogService.getCatalog().subscribe({
      next: (data) => {
        this.catalogoTrabajos = data;
      },
      error: () => console.error('Error al cargar catálogo de trabajos')
    });
  }

  /**
   * Busca automáticamente el precio de un producto mientras el usuario escribe o selecciona un nombre
   */
  buscarPrecio(): void {
    if (!this.nuevoItem.productName) {
      this.nuevoItem.unitPrice = 0;
      return;
    }
    const nombreInput = this.nuevoItem.productName.trim();
    const producto = this.productosCatalogo.find(
      (p) => p.name.toLowerCase() === nombreInput.toLowerCase()
    );
    this.nuevoItem.unitPrice = producto ? producto.price : 0;
  }

  /**
   * Lógica Inteligente - Busca el precio base sugerido mientras se escribe la mano de obra
   */
  buscarPrecioTrabajo(): void {
    if (!this.nuevoTrabajo.jobName) {
      this.nuevoTrabajo.price = 0;
      return;
    }
    const nombreInput = this.nuevoTrabajo.jobName.trim().toLowerCase();
    const trabajo = this.catalogoTrabajos.find(
      (t) => t.name.toLowerCase() === nombreInput
    );
    this.nuevoTrabajo.price = trabajo ? trabajo.basePrice : 0;
  }

  /**
   * Agrega un item al carrito validando existencia y disponibilidad de stock
   * @param prodControl Control del input para resetear validaciones visuales
   */
  agregarAlCarrito(prodControl: NgModel): void {
    const nombreInput = this.nuevoItem.productName.trim();
    const productoEncontrado = this.productosCatalogo.find(
      (p) => p.name.toLowerCase() === nombreInput.toLowerCase(),
    );

    // Validación: Existencia en catálogo
    if (!productoEncontrado) {
      this.notify.show('error', 'Catálogo', 'No Encontrado', 'El producto ingresado no existe.');
      return;
    }

    // Validación: Stock disponible
    if (this.nuevoItem.quantity > productoEncontrado.stock) {
      this.notify.show('error', 'Stock', 'Cantidad insuficiente', `Disponible: ${productoEncontrado.stock} unidades.`);
      return;
    }

    // Lógica: Si el producto ya está en el carrito, se suma la cantidad; si no, se agrega nuevo
    const index = this.carrito.findIndex(
      (i) => i.productName.toLowerCase() === nombreInput.toLowerCase(),
    );

    if (index !== -1) {
      this.carrito[index].quantity += this.nuevoItem.quantity;
    } else {
      this.carrito.push({
        productName: productoEncontrado.name,
        quantity: this.nuevoItem.quantity,
        unitPrice: productoEncontrado.price
      });
    }

    // Resetear modelo de entrada y limpiar estados de validación del input
    this.nuevoItem = { productName: '', quantity: 1, unitPrice: 0 };
    if (prodControl) {
      prodControl.control.markAsPristine();
      prodControl.control.markAsUntouched();
    }
  }

  /**
   * Agrega un servicio de mano de obra al carrito temporal de trabajos
   * @param jobControl Control del input para limpiar los estados visuales de validación
   */
  agregarTrabajoAlCarrito(jobControl: NgModel): void {
    const nombreInput = this.nuevoTrabajo.jobName.trim();
    if (!nombreInput) return;

    // Validación: Evitar duplicar el mismo concepto en la misma orden de forma idéntica
    const index = this.carritoTrabajos.findIndex(
      (j) => j.jobName.toLowerCase() === nombreInput.toLowerCase()
    );

    if (index !== -1) {
      // Si ya existe, simplemente reemplazamos/actualizamos con el precio nuevo cobrado
      this.carritoTrabajos[index].price = this.nuevoTrabajo.price;
    } else {
      this.carritoTrabajos.push({
        jobName: nombreInput,
        price: this.nuevoTrabajo.price
      });
    }

    // Resetear modelo de entrada de mano de obra
    this.nuevoTrabajo = { jobName: '', price: 0 };
    if (jobControl) {
      jobControl.control.markAsPristine();
      jobControl.control.markAsUntouched();
    }
  }

  /**
   * Procesa el guardado de la orden (Creación o Actualización)
   */
  guardarOrden(): void {
    // BLINDAJE ADICIONAL: Validar que contenga al menos un producto O un trabajo según tu @AssertTrue de Spring
    if (!this.email) return;
    if (this.carrito.length === 0 && this.carritoTrabajos.length === 0) {
      this.notify.show('error', 'Orden', 'Orden Vacía', 'Debe agregar al menos un producto o un detalle de trabajo.');
      return;
    }

    this.isLoading = true;

    // Estructura de datos común mapeando simétricamente lo que tu 'OrderRq' y 'OrderReportRs' esperan
    const payload: OrderRq = {
      email: this.email,
      items: this.carrito.map((item) => ({
        productName: item.productName,
        quantity: item.quantity
      })),
      jobs: this.carritoTrabajos.map((job) => ({
        jobName: job.jobName,
        price: job.price
      }))
    };

    // Decisión de flujo basada en el modo de edición
    const request = (this.editMode && this.orderId)
      ? this.orderService.updateOrder(this.orderId, payload as any)
      : this.orderService.createOrder(payload);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.notify.show(this.editMode ? 'update' : 'create', 'Orden'); 
        this.orderCreated.emit(); 
        this.limpiarYcerrar();   
      },
      error: (err) => {
        this.isLoading = false;
        const backMsg = err.error?.message || 'Error al procesar la solicitud';
        this.notify.show('error', 'Orden', backMsg, 'Verifique los datos.');
      },
    });
  }

  /**
   * Resetea el estado y los datos del formulario.
   */
  public limpiarDatos(): void {
    this.email = null;
    this.carrito = [];
    this.carritoTrabajos = [];
    this.editMode = false;
    this.orderId = null;
    this.nuevoItem = { productName: '', quantity: 1, unitPrice: 0 };
    this.nuevoTrabajo = { jobName: '', price: 0 };

    if (this.orderForm) {
      this.orderForm.resetForm({ quantity: 1 });
    }
    this.cargarCatalogoTrabajos();
  }

  /**
   * Busca y cierra el modal de Bootstrap.
   */
  public cerrarModal(): void {
    const modalElement = document.getElementById('orderCreateModal');
   
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  /**
   * Método original para mantener compatibilidad, 
   */
  public limpiarYcerrar(): void {
    this.limpiarDatos();
    this.cerrarModal();
  }

  /**
   * Cambia la cantidad de un ítem en el carrito.
   * Si la cantidad llega a 0, se elimina automáticamente.
   * @param index Posición en el array
   * @param valor 1 para sumar, -1 para restar
   */
  cambiarCantidad(index: number, valor: number): void {
    const item = this.carrito[index];
    item.quantity += valor;

    if (item.quantity <= 0) {
      this.eliminarDelCarrito(index);
    }
  }

  /**
   * Elimina un producto del carrito por su índice.
   */
  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
  }

  /**
   * Elimina un servicio de mano de obra del carrito por su índice.
   */
  eliminarTrabajoDelCarrito(index: number): void {
    this.carritoTrabajos.splice(index, 1);
  }
  // Agrega estos tres métodos rápidos al final de tu componente:
  activarEdicionPrecio(index: number): void {
    this.editandoIndex = index;
  }

  guardarEdicionPrecio(): void {
    this.editandoIndex = null;
  // Forzamos el refresco del getter del total de la venta
    this.carritoTrabajos = [...this.carritoTrabajos];
  }

  cancelarEdicionPrecio(): void {
    this.editandoIndex = null;
  }
}