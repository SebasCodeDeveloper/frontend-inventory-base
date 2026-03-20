import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { GetProductByNameRq, ProductRq, ProductRs } from '../models/product.model';

/**
 * Servicio encargado de la gestión del catálogo de productos.
 * Proporciona métodos para operaciones CRUD y búsquedas avanzadas.
 */
@Injectable({
  providedIn: 'root',
})
export class ProductService {

// URL base para las operaciones CRUD de productos
private readonly API_URL = `${environment.apiUrl}/products`;

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  constructor(private http: HttpClient) {}
  
/**
   * Recupera la lista completa de productos disponibles.
   * @returns Observable con el array de productos (ProductRs).
   */
getProducts(): Observable<ProductRs[]> {
    return this.http.get<ProductRs[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

/**
   * Obtiene la información detallada de un producto específico.
   * @param id Identificador único (UUID) del producto.
   */
  grtProduct(id: string): Observable<ProductRs> {
    return this.http.get<ProductRs>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

/**
   * Registra un nuevo producto en el sistema.
   * @param body Objeto con los datos del producto (nombre, precio, stock).
   */
  createProduct(body: ProductRq): Observable<ProductRs> {
    return this.http.post<ProductRs>(this.API_URL, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

/**
   * Actualiza los datos de un producto existente.
   * @param id Identificador del recurso a modificar.
   * @param body Datos actualizados del producto.
   */
  updateProduct(id: string, body: ProductRq): Observable<ProductRs> {
    return this.http.put<ProductRs>(`${this.API_URL}/${id}`, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

/**
   * Realiza una búsqueda de productos filtrando por coincidencia en el nombre.
   * @param request Objeto que contiene el término de búsqueda 'productName'.
   */
  getByName(request: GetProductByNameRq): Observable<ProductRs[]> {
    return this.http.post<ProductRs[]>(`${this.API_URL}/search`, request)
    .pipe(catchError(this.handleError));
  }
  
/**
   * Elimina un producto del catálogo permanentemente.
   * @param id Identificador único del producto.
   */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

/**
   * Manejador de excepciones centralizado.
   * Propaga el error original si es un JSON (Business Errors) o genera un Error genérico.
   */
private handleError(error: HttpErrorResponse) {

    if (error.error && typeof error.error === 'object') {
      return throwError(() => error); 
    }

    let msg = 'Ocurrió un error inesperado';
    if (error.error instanceof ErrorEvent) {
      msg = `Error del lado del cliente: ${error.error.message}`;
    } else {
      msg = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(msg));
  }
}
