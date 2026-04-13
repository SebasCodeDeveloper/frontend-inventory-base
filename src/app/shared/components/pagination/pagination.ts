import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss'
})
export class PaginationComponent {
  @Input() paginaActual: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPorPagina: number = 4;
  @Output() pageChanged = new EventEmitter<number>();

  /**
   * Getter para calcular el total de páginas dinámicamente
   */
  get totalPaginas(): number {
    return Math.ceil(this.totalItems / this.itemsPorPagina);
  }

  /**
   * Emite el número de la nueva página al componente padre
   */
  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.pageChanged.emit(nuevaPagina);
    }
  }
}