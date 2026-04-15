import { Component, EventEmitter, Output, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms'; 
import { OrderService } from '../../../core/services/order';
import { NotificationService } from '../../../core/services/notification';
import { ProductService } from '../../../core/services/product';
import { OrderRq, OrderReportRs } from '../../../core/models/order.model';
import { UserService } from '../../../core/services/user';

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

  // Modelo para la entrada de nuevos productos al carrito
  nuevoItem = {
    productName: '',
    quantity: 1,
    unitPrice: 0 
  };

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private userService: UserService, 
    public notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarUsuariosRegistrados(); 
  }

  /**
   * Carga los datos de una orden existente para su edición
   * @param order Objeto con la información de la orden a editar
   */
  public patchData(order: OrderReportRs): void {
    this.editMode = true;
    this.orderId = order.orderId;
    this.email = order.email;
    this.carrito = order.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));
  }

  /**
   * Calcula el total acumulado de la venta actual
   */
  get totalVenta(): number {
    return this.carrito.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
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
   * Procesa el guardado de la orden (Creación o Actualización)
   */
  guardarOrden(): void {
    if (!this.email || this.carrito.length === 0) return;

    this.isLoading = true;

    // Estructura de datos común para ambos casos
    const payload = {
      email: this.email,
      items: this.carrito.map((item) => ({
        productName: item.productName,
        quantity: item.quantity
      })),
    };

    // Decisión de flujo basada en el modo de edición
    const request = (this.editMode && this.orderId)
      ? this.orderService.updateOrder(this.orderId, payload as any)
      : this.orderService.createOrder(payload as OrderRq);

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
   * Limpia todos los campos del formulario y cierra el modal mediante la API de Bootstrap
   */
  public limpiarYcerrar(): void {
  this.email = null;
  this.carrito = [];
  this.editMode = false;
  this.orderId = null;
  this.nuevoItem = { productName: '', quantity: 1, unitPrice: 0 };

  if (this.orderForm) {
    this.orderForm.resetForm({ quantity: 1 });
  }

  const modalElement = document.getElementById('orderCreateModal');
  if (modalElement) {
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.hide();
    }
  }
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
}