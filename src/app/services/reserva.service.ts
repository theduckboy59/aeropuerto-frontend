import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReservaSegmentoAsientoRequest {
  segmentoOperadoId: number;
  asientoVueloId: number;
}

export interface ReservaPasajeroItemRequest {
  pasajeroId?: number | null;

  pasaporte?: string | null;
  nombreCompleto?: string | null;
  fechaNacimiento?: string | null;
  nacionalidad?: string | null;
  codigoArea?: string | null;
  telefono?: string | null;
  telefonoEmergencia?: string | null;
  direccion?: string | null;

  asientoVueloId?: number | null;
  claseVueloId?: number | null;
  cantidadMaletas?: number | null;
  requiereAsiento?: boolean | null;
  precioBase?: number | null;

  tipoPasajero?: string | null;
  adultoResponsablePasajeroId?: number | null;

  segmentosAsientos?: ReservaSegmentoAsientoRequest[];
}

export interface ReservaRequest {
  userId?: number | null;
  pasajeroId?: number | null;

  vueloOperadoId: number;

  segmentoOperadoId?: number | null;
  asientoVueloId?: number | null;
  claseVueloId?: number | null;
  cantidadMaletas?: number | null;
  precioBase?: number | null;
  requiereAsiento?: boolean | null;

  segmentosAsientos?: ReservaSegmentoAsientoRequest[];

  pasajeros?: ReservaPasajeroItemRequest[];
}

export interface ReservaBoletoSegmentoResponse {
  boletoSegmentoId?: number | null;
  segmentoOperadoId?: number | null;
  ordenSegmento?: number | null;
  asientoVueloId?: number | null;
  asiento?: string | null;
  claseVueloId?: number | null;
  claseVueloNombre?: string | null;
  estadoBoletoSegmento?: string | null;
}

export interface ReservaBoletoItemResponse {
  pasajeroId?: number | null;
  nombrePasajero?: string | null;
  pasaporte?: string | null;
  boletoId?: number | null;
  codigoBoleto?: string | null;
  codigoPaseAbordar?: string | null;
  asientoVueloId?: number | null;
  asiento?: string | null;
  cantidadMaletas?: number | null;
  precioBase?: number | null;
  recargoEquipaje?: number | null;
  total?: number | null;
  estadoBoleto?: string | null;
  segmentos?: ReservaBoletoSegmentoResponse[];
}

export interface ReservaResponse {
  reservaId?: number | null;
  userId?: number | null;
  vueloOperadoId?: number | null;
  boletoId?: number | null;
  codigoReserva?: string | null;
  codigoBoleto?: string | null;
  codigoPaseAbordar?: string | null;
  estadoReserva?: string | null;
  estadoBoleto?: string | null;
  asientoVueloId?: number | null;
  asiento?: string | null;
  cantidadMaletas?: number | null;
  cantidadPasajeros?: number | null;
  subtotal?: number | null;
  recargoTotal?: number | null;
  total?: number | null;
  boletos?: ReservaBoletoItemResponse[];
  mensaje?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private api = `${environment.apiUrl}/reservas`;

  constructor(private http: HttpClient) {}

  crear(request: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(this.api, request);
  }

  obtenerPorId(id: number): Observable<ReservaResponse> {
    return this.http.get<ReservaResponse>(`${this.api}/${id}`);
  }

  listarPorPasajero(pasajeroId: number): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(`${this.api}/pasajero/${pasajeroId}`);
  }

  cancelar(id: number): Observable<ReservaResponse> {
    return this.http.patch<ReservaResponse>(`${this.api}/${id}/cancelar`, null);
  }
}