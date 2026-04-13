import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GetProductByNameRq, ProductRs } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product';
import { NotificationService } from '../../core/services/notification';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { FormsModule, Validators } from '@angular/forms';
import { PaginationComponent } from '../../shared/components/pagination/pagination';

/**
 * Componente para la gestión del catálogo de productos.
 * Permite listar, buscar, crear, editar y eliminar productos utilizando un formulario dinámico.
 */
@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent, FormsModule, PaginationComponent],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos implements OnInit {
  //Colección de productos recuperada del backend
  listaProductos: ProductRs[] = [];
  //Estado de carga para mostrar indicadores visuales (spinners)
  isLoading: boolean = false;
  //Mensaje de error para alertas rápidas en la interfaz
  errorMessage: string | null = null;
  //Producto actualmente en edición (null si es creación nueva)
  productoSeleccionado: ProductRs | null = null;
  //Término de búsqueda para filtrar por nombre
  nameBusqueda: string = '';

  //Configuración de campos para el formulario dinámico de usuarios
  paginaActual: number = 1;
  itemsPorPagina: number = 5;

  /**
   * Configuración de campos para el componente 'app-dynamic-form'.
   * Define etiquetas, tipos de datos y validaciones reactivas.
   */
  productFields = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Ej: Mouse Pro',
      validators: [Validators.required, Validators.minLength(3)],
      required: true,
    },
    {
      name: 'price',
      label: 'Precio',
      type: 'number',
      placeholder: '0.00',
      validators: [Validators.required, Validators.min(0)],
      required: true,
    },
    {
      name: 'stock',
      label: 'Stock inicial',
      type: 'number',
      placeholder: '0',
      validators: [Validators.required, Validators.min(0)],
      required: true,
    },
  ];

  constructor(
    private productService: ProductService,
    public notify: NotificationService,
  ) {}

  /**
   * Este Getter es la clave: el HTML usará esto en el *ngFor
   */
  get productosPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.listaProductos.slice(inicio, fin);
  }

  onPageChange(nuevaPagina: number) {
    this.paginaActual = nuevaPagina;
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  /**
   * Función de orden superior que decide si llamar a 'update' o 'create'
   * según la presencia de un ID. Se pasa como referencia al formulario dinámico.
   */
  saveProductAction = (data: any, id?: string) => {
    return id
      ? this.productService.updateProduct(id, data)
      : this.productService.createProduct(data);
  };

  /**
   * Limpia la selección para asegurar que el modal se abra en modo "Creación".
   */
  prepararNuevoProducto(): void {
    this.productoSeleccionado = null;
  }

  /**
   * Carga los datos de un producto en el estado local para enviarlos al modal de edición.
   * @param product El producto a editar.
   */
  editarProducto(product: ProductRs): void {
    this.productoSeleccionado = { ...product };
  }

  /**
   * Callback ejecutado cuando el formulario dinámico termina una operación exitosa.
   */
  onProductOperationSuccess() {
    const action = this.productoSeleccionado ? 'update' : 'create';
    this.cargarProductos();
    this.notify.show(action, 'Product');
    this.productoSeleccionado = null;
  }

  /**
   * Consulta el catálogo completo de productos.
   */
  cargarProductos(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.listaProductos = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status !== 404) {
          this.errorMessage =
            'No se pudo conectar con el servidor por favor intente más tarde o revise su conexión.';
        } else {
          this.listaProductos = [];
        }
      },
    });
  }

  /**
   * Realiza una búsqueda por nombre. Si el input está vacío, recarga todo el catálogo.
   */
  buscarPorProducto(): void {
    this.paginaActual = 1;
    if (!this.nameBusqueda.trim()) {
      this.cargarProductos();
      return;
    }
    const request: GetProductByNameRq = { productName: this.nameBusqueda.trim() };
    this.isLoading = true;
    this.productService.getByName(request).subscribe({
      next: (data) => {
        this.listaProductos = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.notify.show('error', 'Product', err.error?.message, 'Verifique los datos ingresados');
        this.isLoading = false;
      },
    });
  }

  /**
   * Determina si un producto está bloqueado para eliminación.
   * Se bloquea si tiene detalles de orden cuyo estado no sea 'CANCELLED'.
   */
  isProductBlocked(producto: ProductRs): boolean {
    if (!producto.orderDetails || producto.orderDetails.length === 0) return false;
    return producto.orderDetails.some((detail) => detail.orderStatus !== 'CANCELLED');
  }

  /**
   * Gestiona la eliminación de un producto.
   * Si el producto tiene ventas asociadas activas, el botón debería estar deshabilitado por lógica de UI.
   * Si está limpio o tiene órdenes canceladas, solicita confirmación previa al usuario.
   */
  eliminarProducto(producto: ProductRs): void {
    // Verificamos si tiene historial en el detalle de órdenes
    const tieneVentas = producto.orderDetails && producto.orderDetails.length > 0;

    /**
     * Lógica Senior: Si detectamos que tiene ventas, disparamos la petición directamente.
     * Esto permite que el Backend valide si las órdenes están CANCELLED o no,
     * y nos devuelva el mensaje de error específico definido en el BusinessErrorType.
     */
    if (tieneVentas) {
      this.productService.deleteProduct(producto.id).subscribe({
        error: (err) => {
          const backMsg = err.error?.message;
          this.notify.show('error', 'Product', backMsg, 'Validación de Inventario');
        },
      });
      return;
    }

    // Si el array de detalles está vacío, procedemos con la confirmación visual normal
    this.notify.askConfirmation(() => {
      this.isLoading = true;
      this.productService.deleteProduct(producto.id).subscribe({
        next: () => {
          this.cargarProductos();
          this.notify.show('delete', 'Product');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          const backMsg = err.error?.message || 'Error al eliminar producto.';
          this.notify.show('error', 'Product', backMsg, 'No se pudo completar la acción');
        },
      });
    });
  }
}
