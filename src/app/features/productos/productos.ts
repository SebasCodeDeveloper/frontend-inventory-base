import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProductRs } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product';
import { NotificationService } from '../../core/services/notification';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos implements OnInit {
  listaProductos: ProductRs[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  productoSeleccionado: ProductRs | null = null;

// Definición de los campos para el formulario dinámico
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

  ngOnInit(): void {
    this.cargarProductos();
  }
  // Método para manejar la acción de guardar (crear o actualizar)
  saveProductAction = (data: any, id?: string) => {
    return id
      ? this.productService.updateProduct(id, data)
      : this.productService.createProduct(data);
  };
  // Método para preparar el formulario de creación (limpiar selección)
  prepararNuevoProducto(): void {
    this.productoSeleccionado = null;
  }
// Método para preparar el formulario de edición con los datos del producto seleccionado
  editarProducto(product: ProductRs): void {
    this.productoSeleccionado = { ...product };
  }
  // Método para manejar el éxito de la operación (crear o actualizar)
  onProductOperationSuccess() {
    const action = this.productoSeleccionado ? 'update' : 'create';
    this.cargarProductos();
    this.notify.show(action, 'Product');
    this.productoSeleccionado = null;
  }

// Método para cargar productos desde el backend
  cargarProductos(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.listaProductos = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo conectar con el servidor Backend.';
        this.isLoading = false;
      },
    });
  }

//metodo para eliminar un producto
  eliminarProducto(id: string): void {
    this.notify.askConfirmation(() => {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          console.log(`Producto con ID ${id} eliminado exitosamente.`);
          this.cargarProductos();
          this.notify.show('delete', 'Product');
        },
        error: () => (this.errorMessage = 'Error al eliminar producto.'),
      });
    });
  }
}
