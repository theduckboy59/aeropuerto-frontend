import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClienteUbicacionDisponible {
  pais: string | null;
  ciudad: string | null;
  totalAeropuertos: number | null;
  totalVuelos: number | null;
}

export interface ClienteAeropuertoDisponible {
  aeropuertoId: number;
  nombre: string | null;
  codigoIata: string | null;
  codigoIcao: string | null;
  pais: string | null;
  ciudad: string | null;
  totalVuelos: number | null;
  asientosDisponiblesTotal: number | null;
}

export interface ClienteDestinoAutorizado {
  aeropuertoId: number;
  nombre: string | null;
  codigoIata: string | null;
  ciudad: string | null;
  pais: string | null;
}

export interface ClienteFechaDisponible {
  fechaSalida: string | null;
  vuelosDisponibles: number | null;
  precioMinimo: number | null;
}

export interface ClienteVueloSegmentoDisponible {
  segmentoOperadoId: number;
  segmentoVueloId: number | null;
  ordenSegmento: number | null;

  aeropuertoSalidaId: number | null;
  aeropuertoSalidaNombre: string | null;
  aeropuertoSalidaCodigoIata: string | null;
  aeropuertoSalidaPais: string | null;
  aeropuertoSalidaCiudad: string | null;

  aeropuertoLlegadaId: number | null;
  aeropuertoLlegadaNombre: string | null;
  aeropuertoLlegadaCodigoIata: string | null;
  aeropuertoLlegadaPais: string | null;
  aeropuertoLlegadaCiudad: string | null;

  fechaSalida: string | null;
  horaSalida: string | null;
  fechaLlegada: string | null;
  horaLlegada: string | null;

  avionId: number | null;
  codigoAvion: string | null;

  asientosDisponiblesTotal: number | null;
  asientosDisponiblesEconomica: number | null;
  asientosDisponiblesEjecutiva: number | null;
}

export interface ClienteVueloDisponible {
  vueloOperadoId: number;
  vueloProgramadoId: number | null;
  vueloId: number | null;
  codigoVuelo: string | null;

  aerolineaId: number | null;
  aerolineaNombre: string | null;

  aeropuertoSalidaId: number | null;
  aeropuertoSalidaNombre: string | null;
  aeropuertoSalidaCodigoIata: string | null;
  aeropuertoSalidaPais: string | null;
  aeropuertoSalidaCiudad: string | null;

  aeropuertoLlegadaId: number | null;
  aeropuertoLlegadaNombre: string | null;
  aeropuertoLlegadaCodigoIata: string | null;
  aeropuertoLlegadaPais: string | null;
  aeropuertoLlegadaCiudad: string | null;

  puertaEmbarqueSalida: string | null;
  puertaEmbarqueLlegada: string | null;

  fechaSalida: string | null;
  horaSalida: string | null;
  fechaLlegada: string | null;
  horaLlegada: string | null;

  duracionMinutos: number | null;

  precioEconomica: number | null;
  precioEjecutiva: number | null;

  tipoSegmentoVueloId: number | null;
  tipoSegmentoVueloNombre: string | null;
  requiereNuevoAsiento: boolean | null;

  cantidadSegmentos: number | null;
  tuvoEscala: boolean | null;

  asientosDisponiblesTotal: number | null;
  asientosDisponiblesEconomica: number | null;
  asientosDisponiblesEjecutiva: number | null;

  segmentos?: ClienteVueloSegmentoDisponible[];
}

@Injectable({
  providedIn: 'root'
})
export class ClienteVueloService {
  private api = `${environment.apiUrl}/cliente/vuelos-disponibles`;

  constructor(private http: HttpClient) {}

  buscarOrigenes(q?: string | null): Observable<ClienteUbicacionDisponible[]> {
    let params = new HttpParams();

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<ClienteUbicacionDisponible[]>(
      `${this.api}/origenes`,
      { params }
    );
  }

  buscarAeropuertosSalida(
    pais?: string | null,
    ciudad?: string | null,
    q?: string | null
  ): Observable<ClienteAeropuertoDisponible[]> {
    let params = new HttpParams();

    if (pais && pais.trim()) {
      params = params.set('pais', pais.trim());
    }

    if (ciudad && ciudad.trim()) {
      params = params.set('ciudad', ciudad.trim());
    }

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<ClienteAeropuertoDisponible[]>(
      `${this.api}/aeropuertos-salida`,
      { params }
    );
  }

  buscarDestinosUbicaciones(
    aeropuertoSalidaId: number,
    q?: string | null
  ): Observable<ClienteUbicacionDisponible[]> {
    let params = new HttpParams()
      .set('aeropuertoSalidaId', String(aeropuertoSalidaId));

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<ClienteUbicacionDisponible[]>(
      `${this.api}/destinos-ubicaciones`,
      { params }
    );
  }

  buscarAeropuertosDestino(
    aeropuertoSalidaId: number,
    pais?: string | null,
    ciudad?: string | null,
    q?: string | null
  ): Observable<ClienteAeropuertoDisponible[]> {
    let params = new HttpParams()
      .set('aeropuertoSalidaId', String(aeropuertoSalidaId));

    if (pais && pais.trim()) {
      params = params.set('pais', pais.trim());
    }

    if (ciudad && ciudad.trim()) {
      params = params.set('ciudad', ciudad.trim());
    }

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<ClienteAeropuertoDisponible[]>(
      `${this.api}/aeropuertos-destino`,
      { params }
    );
  }

  listarDisponibles(
    aeropuertoSalidaId: number,
    aeropuertoLlegadaId: number,
    fechaSalida?: string | null
  ): Observable<ClienteVueloDisponible[]> {
    let params = new HttpParams()
      .set('aeropuertoSalidaId', String(aeropuertoSalidaId))
      .set('aeropuertoLlegadaId', String(aeropuertoLlegadaId));

    if (fechaSalida && fechaSalida.trim()) {
      params = params.set('fechaSalida', fechaSalida.trim());
    }

    return this.http.get<ClienteVueloDisponible[]>(this.api, { params });
  }

  listarDestinosAutorizados(
    aeropuertoSalidaId: number
  ): Observable<ClienteDestinoAutorizado[]> {
    const params = new HttpParams()
      .set('aeropuertoSalidaId', String(aeropuertoSalidaId));

    return this.http.get<ClienteDestinoAutorizado[]>(
      `${this.api}/destinos-autorizados`,
      { params }
    );
  }

  listarFechasDisponibles(
    aeropuertoSalidaId: number,
    aeropuertoLlegadaId: number
  ): Observable<ClienteFechaDisponible[]> {
    const params = new HttpParams()
      .set('aeropuertoSalidaId', String(aeropuertoSalidaId))
      .set('aeropuertoLlegadaId', String(aeropuertoLlegadaId));

    return this.http.get<ClienteFechaDisponible[]>(
      `${this.api}/fechas-disponibles`,
      { params }
    );
  }

  listarFechasRegresoDisponibles(
    aeropuertoSalidaId: number,
    aeropuertoLlegadaId: number,
    fechaSalida: string
  ): Observable<ClienteFechaDisponible[]> {
    const params = new HttpParams()
      .set('aeropuertoSalidaId', String(aeropuertoSalidaId))
      .set('aeropuertoLlegadaId', String(aeropuertoLlegadaId))
      .set('fechaSalida', fechaSalida);

    return this.http.get<ClienteFechaDisponible[]>(
      `${this.api}/fechas-regreso-disponibles`,
      { params }
    );
  }

  obtenerDetalle(vueloOperadoId: number): Observable<ClienteVueloDisponible> {
    return this.http.get<ClienteVueloDisponible>(
      `${this.api}/${vueloOperadoId}`
    );
  }
}
