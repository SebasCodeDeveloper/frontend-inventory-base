import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { OrderReportRs, OrderRq, GetOrderByEmailRq } from '../models/order.model';

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

// meetodo que optiene el reporte golbal de las ordenes
  getOrdersReport(): Observable<OrderReportRs[]> {
    return this.http.get<OrderReportRs[]>(this.URL_DETAILS).
    pipe(catchError(this.handleError)
    );
  }

  //metodo para bucar una orden por email
getOrdersByEmail(body: GetOrderByEmailRq): Observable<OrderReportRs[]> {
  return this.http.post<OrderReportRs[]>(this.URL_DETAILS, body, this.httpOptions)
    .pipe(catchError(this.handleError));
}

  // metodo para optner los detalles de una orden por id
  getOrderDetailsById(id: string): Observable<OrderReportRs> {
    return this.http.get<OrderReportRs>(`${this.URL_DETAILS}/${id}`)
      .pipe(catchError(this.handleError));
  }

/**
   * Metodos de accion para  (OrderController)
   */

  // metodo para crear una orden
  createOrder(body: OrderRq): Observable<OrderReportRs> {
    return this.http.post<OrderReportRs>(this.URL_ORDERS, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
  
  // metodo para pagar una orden
  pagarOrden(id: string): Observable<OrderReportRs> {
    return this.http.put<OrderReportRs>(`${this.URL_ORDERS}/${id}/pay`, {})
      .pipe(catchError(this.handleError));
  }

  // metodo para cancelar una orden
  cancelarOrden(id: string): Observable<OrderReportRs> {
    return this.http.put<OrderReportRs>(`${this.URL_ORDERS}/${id}/cancel`, {})
      .pipe(catchError(this.handleError));
  }

  // metodo para eliminar una orden
  eliminarOrden(id: string): Observable<void> {
    return this.http.delete<void>(`${this.URL_ORDERS}/${id}`)
      .pipe(catchError(this.handleError));
  }

  //metodo para obtener las ordenes del ordenes
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
