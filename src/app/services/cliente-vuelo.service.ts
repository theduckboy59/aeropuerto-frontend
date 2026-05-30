import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClienteVueloSegmentoDisponible {
  segmentoOperadoId: number;
  segmentoVueloId?: number | null;
  ordenSegmento: number;

  aeropuertoSalidaId: number;
  aeropuertoSalidaNombre?: string | null;
  aeropuertoSalidaCodigoIata?: string | null;

  aeropuertoLlegadaId: number;
  aeropuertoLlegadaNombre?: string | null;
  aeropuertoLlegadaCodigoIata?: string | null;

  fechaSalida?: string | null;
  horaSalida?: string | null;
  fechaLlegada?: string | null;
  horaLlegada?: string | null;

  avionId?: number | null;
  codigoAvion?: string | null;

  asientosDisponiblesTotal?: number | null;
  asientosDisponiblesEconomica?: number | null;
  asientosDisponiblesEjecutiva?: number | null;
}

export interface ClienteVueloDisponible {
  vueloOperadoId: number;
  vueloProgramadoId?: number | null;
  vueloId?: number | null;

  codigoVuelo?: string | null;

  aerolineaId?: number | null;
  aerolineaNombre?: string | null;

  aeropuertoSalidaId?: number | null;
  aeropuertoSalidaNombre?: string | null;
  aeropuertoSalidaCodigoIata?: string | null;

  aeropuertoLlegadaId?: number | null;
  aeropuertoLlegadaNombre?: string | null;
  aeropuertoLlegadaCodigoIata?: string | null;

  puertaEmbarqueSalida?: string | null;
  puertaEmbarqueLlegada?: string | null;

  fechaSalida?: string | null;
  horaSalida?: string | null;
  fechaLlegada?: string | null;
  horaLlegada?: string | null;

  duracionMinutos?: number | null;

  precioEconomica?: number | null;
  precioEjecutiva?: number | null;

  tipoSegmentoVueloId?: number | null;
  tipoSegmentoVueloNombre?: string | null;

  requiereNuevoAsiento?: boolean | null;
  cantidadSegmentos?: number | null;
  tuvoEscala?: boolean | null;

  asientosDisponiblesTotal?: number | null;
  asientosDisponiblesEconomica?: number | null;
  asientosDisponiblesEjecutiva?: number | null;

  segmentos?: ClienteVueloSegmentoDisponible[];
}

@Injectable({
  providedIn: 'root'
})
export class ClienteVueloService {
  private api = `${environment.apiUrl}/cliente/vuelos-disponibles`;

  constructor(private http: HttpClient) {}

  listarDisponibles(
  aeropuertoSalidaId: number,
  aeropuertoLlegadaId: number,
  fechaSalida?: string | null
): Observable<ClienteVueloDisponible[]> {
  let params = new HttpParams()
    .set('aeropuertoSalidaId', String(aeropuertoSalidaId))
    .set('aeropuertoLlegadaId', String(aeropuertoLlegadaId));

  if (fechaSalida) {
    params = params.set('fechaSalida', fechaSalida);
  }

  return this.http.get<ClienteVueloDisponible[]>(this.api, { params });
}

obtenerDetalle(vueloOperadoId: number): Observable<ClienteVueloDisponible> {
  return this.http.get<ClienteVueloDisponible>(`${this.api}/${vueloOperadoId}`);
}
}