import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { OrderReportRs, OrderRq, GetOrderByEmailRq } from '../models/order.model';

/**
 * Servicio encargado de la gestión de órdenes de compra.
 * Se comunica con OrderController para acciones y con OrderDetailController para reportes.
 */
@Injectable({
  providedIn: 'root',
})
export class OrderService {

  // URL base para las operaciones relacionadas con órdenes
  private readonly URL_ORDERS = `${environment.apiUrl}/orders`;
  private readonly URL_DETAILS = `${environment.apiUrl}/details`;
  
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  constructor(private http: HttpClient) {}

/**
   * Metodos de consula para  (OrderDetailController)
   */

/**
   * Obtiene el listado global de todas las órdenes registradas.
   * @returns Observable con un array de reportes de órdenes.
   */
  getOrdersReport(): Observable<OrderReportRs[]> {
    return this.http.get<OrderReportRs[]>(this.URL_DETAILS).
    pipe(catchError(this.handleError)
    );
  }

/**
   * Filtra las órdenes asociadas a un correo electrónico específico.
   * @param body Objeto que contiene el email del cliente.
   * @returns Observable con las órdenes encontradas.
   */
getOrdersByEmail(body: GetOrderByEmailRq): Observable<OrderReportRs[]> {
  return this.http.post<OrderReportRs[]>(this.URL_DETAILS, body, this.httpOptions)
    .pipe(catchError(this.handleError));
}

/**
   * Recupera la información completa de una orden mediante su identificador único.
   * @param id UUID de la orden.
   */
  getOrderDetailsById(id: string): Observable<OrderReportRs> {
    return this.http.get<OrderReportRs>(`${this.URL_DETAILS}/${id}`)
      .pipe(catchError(this.handleError));
  }

/**
   * Metodos de accion para  (OrderController)
   */

/**
   * Registra una nueva orden en el sistema.
   * @param body Datos de la orden y productos seleccionados.
   */
  createOrder(body: OrderRq): Observable<OrderReportRs> {
    return this.http.post<OrderReportRs>(this.URL_ORDERS, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  
/**
   * Cambia el estado de una orden a 'PAID'.
   * @param id Identificador de la orden a procesar.
   */
  pagarOrden(id: string): Observable<OrderReportRs> {
    return this.http.put<OrderReportRs>(`${this.URL_ORDERS}/${id}/pay`, {})
      .pipe(catchError(this.handleError));
  }

 /**
   * Cambia el estado de una orden a 'CANCELLED'.
   * @param id Identificador de la orden a anular.
   */
  cancelarOrden(id: string): Observable<OrderReportRs> {
    return this.http.put<OrderReportRs>(`${this.URL_ORDERS}/${id}/cancel`, {})
      .pipe(catchError(this.handleError));
  }

/**
   * Elimina permanentemente una orden del sistema.
   * @param id Identificador de la orden a remover.
   */
  eliminarOrden(id: string): Observable<void> {
    return this.http.delete<void>(`${this.URL_ORDERS}/${id}`)
      .pipe(catchError(this.handleError));
  }

/**
   * Manejador centralizado de errores HTTP.
   * Captura tanto errores de red como excepciones enviadas por el Backend.
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