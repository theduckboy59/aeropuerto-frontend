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

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private api = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  pagar(request: PagoRequest): Observable<any> {
    return this.http.post<any>(this.api, request);
  }

  listarPorReserva(reservaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/reserva/${reservaId}`);
  }
}

