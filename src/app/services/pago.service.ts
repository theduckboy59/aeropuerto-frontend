import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PagoRequest {
  reservaId: number;
  metodoPagoId: number;
  monto: number;
  recargoEquipaje?: number | null;
  nit?: string | null;
  nombreCliente?: string | null;
}

export interface ConfirmarPagoRequest {
  metodoPagoId: number;
  nit?: string | null;
  nombreCliente?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private api = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  pagar(request: PagoRequest): Observable<any> {
    return this.http.post<any>(this.api, request);
  }

  confirmarPagoPendiente(
    pagoId: number,
    request: ConfirmarPagoRequest
  ): Observable<any> {
    return this.http.patch<any>(`${this.api}/${pagoId}/confirmar`, request);
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  listarPorReserva(reservaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/reserva/${reservaId}`);
  }
}