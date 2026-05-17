import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { GetProductByNameRq, ProductRs } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product';
import { NotificationService } from '../../core/services/notification';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { FormsModule, Validators } from '@angular/forms';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { Observable } from 'rxjs';

declare var bootstrap: any;

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
  //Vista de modal view
  isViewMode: boolean = false;
  // Almacenamiento local de productos para paginación (se mantiene separado de la lista completa)
  productos: any[] = [];

  //Configuración de campos para el formulario dinámico de usuarios
  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  
//Estado del switch de seguridad para acciones sensibles
  isProtectionEnabled: boolean = false;
  //Estado de validación de contraseña para permitir operaciones protegidas
  isPasswordValidated: boolean = false;
  // Almacenamiento temporal de la contraseña maestra para validar operaciones protegidas
  private masterPasswordTemp: string = '';
  

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

/** * Al iniciar el componente, cargamos el catálogo completo de productos.
 * También nos suscribimos a la notificación de cancelación para limpiar la sesión administrativa si es necesario.
 */
  ngOnInit(): void {
    this.cargarProductos();
    this.notify.cancel$.subscribe(() => {
      this.limpiarSesionAdmin();
    });
  }

  /**
   * Consulta el catálogo completo de productos.
   */
  cargarProductos(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.productos = data;
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
   * Ajustamos la acción para que el DynamicForm le pase los datos, 
   * y nosotros decidimos cómo enviarlos al Service.
   */
saveProductAction = (formData: any, id?: string) => {
  if (!id) return this.productService.createProduct(formData);

  return new Observable((observer: any) => {
    const executeUpdate = (password: string) => {
      this.notify.lastModalId = null; 
      this.notify.isValidating = false; 

      const payload = { productRq: formData, auth: { password } };
      this.productService.updateProduct(id, payload).subscribe({
        next: (res) => {
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          this.notify.isValidating = false;
          observer.error(err);
        }
      });
    };

    if (this.isPasswordValidated) {
      executeUpdate(this.notify.adminPasswordTemp);
    } else {
      this.notify.isValidating = true;
      this.notify.lastModalId = 'productModal'; 
      this.cerrarModalProducto();

      this.notify.askPassword((passwordEntered) => {
        executeUpdate(passwordEntered);
      });
    }
  });
}
private cerrarModalProducto(): void {
  const modalElement = document.getElementById('productModal'); 
  if (modalElement) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.hide();
  }
}


/** * Maneja el cambio del switch de seguridad.
 * Si se activa, solicita la contraseña maestra para validar al usuario.
 * Si se desactiva, limpia cualquier estado de sesión relacionado.
 */
onSecuritySwitchChange(event: any) {
  const isChecked = event.target.checked;

  if (isChecked) {
    this.notify.askPassword((pass) => {
      const productoPrueba = this.productos && this.productos.length > 0 ? this.productos[0] : null;

      if (!productoPrueba) {

        this.masterPasswordTemp = pass;
        this.isPasswordValidated = true;
        this.isProtectionEnabled = true;
        this.notify.show('success', 'Seguridad', 'Modo Admin activo. Se validará al crear el primer producto.');
        return;
      }
      
      const payload = {
        productRq: { name: productoPrueba.name, price: productoPrueba.price, stock: productoPrueba.stock },
        auth: { password: pass }
      };

      this.productService.updateProduct(productoPrueba.id, payload).subscribe({
        next: () => {
          this.masterPasswordTemp = pass;
          this.isPasswordValidated = true;
          this.isProtectionEnabled = true;
          this.notify.show('success', 'Seguridad', 'Contraseña correcta');
        },
        error: (err) => {
          this.limpiarSesionAdmin(); 
          this.notify.show('error', 'Seguridad', 'La contraseña de inventario es incorrecta', 'Verifique los datos ingresados');
        }
      });
    });
  } else {
    this.limpiarSesionAdmin();
  }
}

/** * Limpia el estado de la sesión administrativa.
 * Se llama al cancelar la acción o al desactivar el switch de seguridad.
 */
private limpiarSesionAdmin() {
  this.masterPasswordTemp = ''; 
  this.isPasswordValidated = false; 
  this.isProtectionEnabled = false; 
}

  /**
   * Activa el modo de solo lectura y carga el producto en el formulario.
   * Utilizado cuando el usuario desea consultar detalles sin modificar.
   */
  verProducto(product: ProductRs): void {
    this.isViewMode = true;
    this.productoSeleccionado = { ...product };
  }

  /**
   * Desactiva el modo de lectura y carga el producto para permitir su edición.
   */
  editarProducto(product: ProductRs): void {
    this.isViewMode = false;
    this.productoSeleccionado = { ...product };
  }

  /**
   * Limpia el estado del producto seleccionado para preparar el formulario
   * ante la creación de un nuevo registro desde cero.
   */
  prepararNuevoProducto(): void {
    this.isViewMode = false;
    this.productoSeleccionado = null;
  }

  /**
   * Callback ejecutado tras una operación exitosa.
   * Actualiza la lista local y mantiene el contexto del producto editado.
   */
    onProductOperationSuccess() {
  
    const idEditado = this.productoSeleccionado ? this.productoSeleccionado.id : null;
    const action = idEditado ? 'update' : 'create';

        this.productService.getProducts().subscribe({
      next: (data) => {
        this.listaProductos = data || [];

        if (idEditado) {
          this.productoSeleccionado = this.listaProductos.find(p => p.id === idEditado) || null;
        } else {

          this.productoSeleccionado = null;
        }

        this.notify.show(action, 'Product');
      },
      error: (err) => {
        this.notify.show('error', 'Product', 'Error al sincronizar los datos.');
      }
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

    const executeDelete = (password: string) => {
      this.productService.deleteProduct(producto.id, { password }).subscribe({
        next: () => {
          this.cargarProductos();
          this.notify.show('delete', 'Product');
        },
        error: (err) => {
          const backMsg = err.error?.message || 'Error al eliminar producto.';
          this.notify.show('error', 'Product', backMsg, 'No se pudo completar la acción');
        },
      });
    };

    const askPasswordIfNeeded = (run: (password: string) => void) => {
      if (this.isPasswordValidated) {
        run(this.notify.adminPasswordTemp);
      } else {
        this.notify.askPassword((passwordEntered) => run(passwordEntered));
      }
    };

    // Si detectamos que tiene ventas, ejecutamos directo (el backend valida CANCELLED vs no CANCELLED)
    if (tieneVentas) {
      askPasswordIfNeeded(executeDelete);
      return;
    }

    // Si el array de detalles está vacío, procedemos con confirmación visual + contraseña
    this.notify.askConfirmation('delete', () => {
      askPasswordIfNeeded(executeDelete);
    });
  }
}
