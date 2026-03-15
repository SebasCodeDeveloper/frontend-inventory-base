import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { ProductRq, ProductRs } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {

// URL base para las operaciones CRUD de productos
private readonly API_URL = `${environment.apiUrl}/products`;

  // Configuración de las opciones HTTP, incluyendo los encabezados
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(private http: HttpClient) {}
  
// CRUD Methods
getProducts(): Observable<ProductRs[]> {
    return this.http.get<ProductRs[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }
// Método para obtener un producto por ID (útil para edición)
  grtProduct(id: string): Observable<ProductRs> {
    return this.http.get<ProductRs>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

// Método para crear un nuevo producto
  createProduct(body: ProductRq): Observable<ProductRs> {
    return this.http.post<ProductRs>(this.API_URL, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
// Método para actualizar un producto existente
  updateProduct(id: string, body: ProductRq): Observable<ProductRs> {
    return this.http.put<ProductRs>(`${this.API_URL}/${id}`, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

// Método para eliminar un producto
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

// Manejo centralizado de errores
private handleError(error: HttpErrorResponse) {

    if (error.error && typeof error.error === 'object') {
      return throwError(() => error); 
    }

  // Si es un error físico de red o cliente (no hay JSON)
    let msg = 'Ocurrió un error inesperado';
    if (error.error instanceof ErrorEvent) {
      msg = `Error del lado del cliente: ${error.error.message}`;
    } else {
      msg = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(msg));
  }
}
