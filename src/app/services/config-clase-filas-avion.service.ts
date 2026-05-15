import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ConfigClaseFilasAvion {
  id: number | null;
  avionId: number;
  claseVueloId: number | null;
  claseVueloNombre?: string | null;
  filaDesde: number | null;
  filaHasta: number | null;
  activo: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ConfigClaseFilasAvionRequest {
  avionId?: number;
  claseVueloId: number;
  filaDesde: number | null;
  filaHasta: number | null;
  activo?: boolean;
}

export interface ConfigClaseFilasAvionItemRequest {
  claseVueloId: number;
  filaDesde: number | null;
  filaHasta: number | null;
}

export interface ConfigClaseFilasAvionCompletaRequest {
  configuraciones: ConfigClaseFilasAvionItemRequest[];
}

export interface ConfigClaseFilasAvionCompleta {
  avionId: number;
  codigoAvion: string;
  modeloAvionId?: number | null;
  modeloFabricante?: string | null;
  modeloCodigo?: string | null;
  modeloNombre?: string | null;
  filasConfiguradas: number;
  configurado: boolean;
  configuraciones: ConfigClaseFilasAvion[];
  filasInhabilitadasAutomaticas: string[];
}

export interface ConfigClaseFilasAvionSugerencia {
  avionId: number;
  filasConfiguradas: number;
  claseBase: string;
  filaDesdeBase: number;
  filaHastaBase: number;
  claseSugerida: string;
  filaDesdeSugerida: number | null;
  filaHastaSugerida: number | null;
  mensaje: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigClaseFilasAvionService {
  private apiUrl = `${environment.apiUrl}/config-clase-filas-avion`;

  constructor(private http: HttpClient) {}

  listarAvionesActivosCompletos(q?: string): Observable<ConfigClaseFilasAvionCompleta[]> {
    let params = new HttpParams();

    const query = (q ?? '').trim();

    if (query) {
      params = params.set('q', query);
    }

    return this.http.get<ConfigClaseFilasAvionCompleta[]>(
      `${this.apiUrl}/aviones-activos/completa`,
      { params }
    );
  }

  obtenerCompleta(avionId: number): Observable<ConfigClaseFilasAvionCompleta> {
    return this.http.get<ConfigClaseFilasAvionCompleta>(
      `${this.apiUrl}/avion/${avionId}/completa`
    );
  }

  crearRango(
    avionId: number,
    request: ConfigClaseFilasAvionRequest
  ): Observable<ConfigClaseFilasAvionCompleta> {
    const payload = this.buildPayload(request);

    return this.http.post<ConfigClaseFilasAvionCompleta>(
      `${this.apiUrl}/avion/${avionId}/rango`,
      payload
    );
  }

  actualizarRango(
    rangoId: number,
    request: ConfigClaseFilasAvionRequest
  ): Observable<ConfigClaseFilasAvionCompleta> {
    const payload = this.buildPayload(request);

    return this.http.put<ConfigClaseFilasAvionCompleta>(
      `${this.apiUrl}/rango/${rangoId}`,
      payload
    );
  }

  eliminarRango(rangoId: number): Observable<ConfigClaseFilasAvionCompleta> {
    return this.http.delete<ConfigClaseFilasAvionCompleta>(
      `${this.apiUrl}/rango/${rangoId}`
    );
  }

  reiniciarConfiguracionCompleta(avionId: number): Observable<ConfigClaseFilasAvionCompleta> {
    return this.http.delete<ConfigClaseFilasAvionCompleta>(
      `${this.apiUrl}/avion/${avionId}/completa`
    );
  }

  sugerirSiguienteRango(params: {
    avionId: number;
    claseBase: string;
    filaDesde: number;
    filaHasta: number;
  }): Observable<ConfigClaseFilasAvionSugerencia> {
    const httpParams = new HttpParams()
      .set('claseBase', params.claseBase)
      .set('filaDesde', String(params.filaDesde))
      .set('filaHasta', String(params.filaHasta));

    return this.http.get<ConfigClaseFilasAvionSugerencia>(
      `${this.apiUrl}/avion/${params.avionId}/sugerencia`,
      { params: httpParams }
    );
  }

  // Compatibilidad para pantallas viejas como AsientoUbi.
  listar(params: {
    avionId?: number | string | null;
    claseVueloId?: number | string | null;
    activo?: boolean | null;
    page?: number;
    size?: number;
  }): Observable<PageResponse<ConfigClaseFilasAvion>> {
    const page = Number(params.page ?? 0);
    const size = Number(params.size ?? 10);

    if (params.avionId !== null && params.avionId !== undefined && params.avionId !== '') {
      return this.obtenerCompleta(Number(params.avionId)).pipe(
        map((res) => {
          let content = (res.configuraciones ?? [])
            .filter((item) => item.id !== null)
            .filter((item) => {
              if (params.activo === null || params.activo === undefined) return true;
              return item.activo === params.activo;
            })
            .filter((item) => {
              if (params.claseVueloId === null || params.claseVueloId === undefined || params.claseVueloId === '') {
                return true;
              }

              return Number(item.claseVueloId) === Number(params.claseVueloId);
            });

          const totalElements = content.length;
          const totalPages = Math.ceil(totalElements / size);
          content = content.slice(page * size, page * size + size);

          return {
            content,
            totalElements,
            totalPages,
            number: page,
            size
          };
        })
      );
    }

    return this.listarAvionesActivosCompletos().pipe(
      map((items) => {
        let content = items.flatMap((item) =>
          (item.configuraciones ?? []).filter((config) => config.id !== null)
        );

        if (params.activo !== null && params.activo !== undefined) {
          content = content.filter((item) => item.activo === params.activo);
        }

        if (params.claseVueloId !== null && params.claseVueloId !== undefined && params.claseVueloId !== '') {
          content = content.filter((item) => Number(item.claseVueloId) === Number(params.claseVueloId));
        }

        const totalElements = content.length;
        const totalPages = Math.ceil(totalElements / size);
        const paged = content.slice(page * size, page * size + size);

        return {
          content: paged,
          totalElements,
          totalPages,
          number: page,
          size
        };
      })
    );
  }

  // Compatibilidad. No usar para el nuevo flujo.
  obtenerPorId(id: number): Observable<ConfigClaseFilasAvion> {
    return this.http.get<ConfigClaseFilasAvion>(`${this.apiUrl}/${id}`);
  }

  getById(id: number): Observable<ConfigClaseFilasAvion> {
    return this.obtenerPorId(id);
  }

  // Compatibilidad. Para nuevo flujo usar crearRango.
  crear(request: ConfigClaseFilasAvionRequest): Observable<ConfigClaseFilasAvionCompleta> {
    if (!request.avionId) {
      return of({
        avionId: 0,
        codigoAvion: '',
        filasConfiguradas: 0,
        configurado: false,
        configuraciones: [],
        filasInhabilitadasAutomaticas: []
      });
    }

    return this.crearRango(Number(request.avionId), request);
  }

  // Compatibilidad. Para nuevo flujo usar actualizarRango.
  actualizar(
    id: number,
    request: ConfigClaseFilasAvionRequest
  ): Observable<ConfigClaseFilasAvionCompleta> {
    return this.actualizarRango(id, request);
  }

  // Compatibilidad. Para nuevo flujo usar eliminarRango.
  desactivar(id: number | null): Observable<ConfigClaseFilasAvionCompleta> {
    if (id === null) {
      return of({
        avionId: 0,
        codigoAvion: '',
        filasConfiguradas: 0,
        configurado: false,
        configuraciones: [],
        filasInhabilitadasAutomaticas: []
      });
    }

    return this.eliminarRango(id);
  }

  // Compatibilidad. El flujo nuevo no usa configuración completa como bloque.
  guardarCompleta(
    avionId: number,
    request: ConfigClaseFilasAvionCompletaRequest
  ): Observable<ConfigClaseFilasAvionCompleta> {
    const rangos = (request.configuraciones ?? [])
      .filter((item) => item.claseVueloId)
      .filter((item) => item.filaDesde !== null && item.filaHasta !== null);

    if (!rangos.length) {
      return this.obtenerCompleta(avionId);
    }

    return forkJoin(
      rangos.map((rango) =>
        this.crearRango(avionId, {
          claseVueloId: rango.claseVueloId,
          filaDesde: rango.filaDesde,
          filaHasta: rango.filaHasta
        })
      )
    ).pipe(
      map((responses) => responses[responses.length - 1])
    );
  }

  desactivarCompleta(avionId: number): Observable<ConfigClaseFilasAvionCompleta> {
    return this.reiniciarConfiguracionCompleta(avionId);
  }

  private buildPayload(request: ConfigClaseFilasAvionRequest) {
    return {
      claseVueloId: Number(request.claseVueloId),
      filaDesde: request.filaDesde === null ? null : Number(request.filaDesde),
      filaHasta: request.filaHasta === null ? null : Number(request.filaHasta)
    };
  }
}