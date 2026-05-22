import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Vuelo } from './vuelo.service';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface VueloOperado {
  id: number;

  vueloProgramadoId: number;
  vueloId?: number | null;
  codigoVuelo?: string | null;

  aerolineaId?: number | null;
  aerolineaNombre?: string | null;

  aeropuertoSalidaId?: number | null;
  aeropuertoSalidaNombre?: string | null;
  aeropuertoSalidaCodigoIata?: string | null;
  puertaEmbarqueSalida?: string | null;

  aeropuertoLlegadaId?: number | null;
  aeropuertoLlegadaNombre?: string | null;
  aeropuertoLlegadaCodigoIata?: string | null;
  puertaEmbarqueLlegada?: string | null;

  fechaSalidaProgramada?: string | null;
  horaSalidaProgramada?: string | null;
  fechaLlegadaProgramada?: string | null;
  horaLlegadaProgramada?: string | null;

  avionId: number;
  codigoAvion?: string | null;

  tripulacionId: number;
  codigoTripulacion?: string | null;

  tipoSegmentoVueloId?: number | null;
  tipoSegmentoVueloNombre?: string | null;
  requiereNuevoAsiento?: boolean | null;
  permiteEmbarque?: boolean | null;
  detieneFlujoSiCancela?: boolean | null;

  estadoVueloId: number;
  estadoVueloNombre?: string | null;

  cantidadTramos?: number | null;
  tramoActual?: number | null;
  tuvoEscala?: boolean | null;

  fechaSalidaReal?: string | null;
  horaSalidaReal?: string | null;
  fechaLlegadaReal?: string | null;
  horaLlegadaReal?: string | null;

  puedeEditarDatos?: boolean | null;
  puedeCancelar?: boolean | null;
  puedeFinalizar?: boolean | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VueloOperadoRequest {
  vueloProgramadoId: number | null;
  avionId: number | null;
  tripulacionId: number | null;
  tipoSegmentoVueloId?: number | null;
  cantidadTramos?: number | null;
}

export interface VueloOperadoFiltros {
  vueloProgramadoId?: number | string | null;
  avionId?: number | string | null;
  tripulacionId?: number | string | null;
  estadoVueloId?: number | string | null;
  fechaSalidaReal?: string | null;
  fechaLlegadaReal?: string | null;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VueloOperadoService {

  private api = `${environment.apiUrl}/vuelos-operados`;

  constructor(private http: HttpClient) {}

  listar(filtros: VueloOperadoFiltros = {}): Observable<Page<VueloOperado>> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params = params.set(key, String(value).trim());
      }
    });

    return this.http.get<Page<VueloOperado>>(this.api, { params });
  }

  obtener(id: number): Observable<VueloOperado> {
    return this.http.get<VueloOperado>(`${this.api}/${id}`);
  }

  crear(request: VueloOperadoRequest): Observable<VueloOperado> {
    return this.http.post<VueloOperado>(
      this.api,
      this.normalizarPayload(request)
    );
  }

  actualizar(id: number, request: VueloOperadoRequest): Observable<VueloOperado> {
    return this.http.put<VueloOperado>(
      `${this.api}/${id}`,
      this.normalizarPayload(request)
    );
  }

  cambiarEstado(id: number, estadoVueloId: number): Observable<VueloOperado> {
    const params = new HttpParams().set('estadoVueloId', String(estadoVueloId));

    return this.http.patch<VueloOperado>(
      `${this.api}/${id}/estado`,
      null,
      { params }
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  listarEstadosVuelo(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/catalogos/estado-vuelo`);
  }

  listarTiposSegmentoVuelo(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/catalogos/tipo-segmento-vuelo`);
  }

  listarVuelosProgramadosActivos(): Observable<Vuelo[]> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '1000');

    return this.http.get<any>(`${environment.apiUrl}/vuelos`, { params }).pipe(
      map((res) => this.getContent<Vuelo>(res))
    );
  }

  listarAvionesDisponibles(aerolineaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/catalogos/estado-avion`).pipe(
      switchMap((estados) => {
        const disponible = (estados ?? []).find((e: any) =>
          this.normalize(e?.nombre).includes('DISPONIBLE')
        );

        let params = new HttpParams()
          .set('page', '0')
          .set('size', '1000')
          .set('estadoId', '1')
          .set('aerolineaId', String(aerolineaId));

        if (disponible?.id) {
          params = params.set('estadoAvionId', String(disponible.id));
        }

        return this.http.get<any>(`${environment.apiUrl}/avion`, { params });
      }),
      map((res) => this.getContent<any>(res))
    );
  }

  listarTripulacionesDisponibles(aerolineaId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/tripulaciones/disponibles/${aerolineaId}`
    );
  }

  private normalizarPayload(request: VueloOperadoRequest): VueloOperadoRequest {
    return {
      vueloProgramadoId: this.toNumberOrNull(request.vueloProgramadoId),
      avionId: this.toNumberOrNull(request.avionId),
      tripulacionId: this.toNumberOrNull(request.tripulacionId),
      tipoSegmentoVueloId: this.toNumberOrNull(request.tipoSegmentoVueloId),
      cantidadTramos: this.toNumberOrNull(request.cantidadTramos)
    };
  }

  private toNumberOrNull(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const n = Number(value);

    return Number.isNaN(n) ? null : n;
  }

  private getContent<T>(res: any): T[] {
    if (Array.isArray(res)) {
      return res;
    }

    return res?.content ?? [];
  }

  private normalize(value: any): string {
    return String(value ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }
}