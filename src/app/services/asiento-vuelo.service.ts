import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from './vuelo-operado.service';

export interface AsientoVuelo {
  id: number;
  segmentoOperadoId?: number | null;
  codigoAsientoSistema?: string | null;
  estadoAsientoId?: number | null;
  estadoAsientoNombre?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AsientoVueloService {
  private api = `${environment.apiUrl}/asientos-vuelo`;

  constructor(private http: HttpClient) {}

  listar(paramsIn: Record<string, any> = {}): Observable<Page<AsientoVuelo>> {
    let params = new HttpParams();
    Object.entries(paramsIn).forEach(([k, v]) => {
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        params = params.set(k, String(v).trim());
      }
    });
    return this.http.get<Page<AsientoVuelo>>(this.api, { params });
  }

  listarDisponiblesPorSegmento(
    segmentoOperadoId: number,
    claseVueloId?: number | null
  ): Observable<AsientoVuelo[]> {
    const params: Record<string, any> = {
      segmentoOperadoId,
      estadoAsientoId: 1,
      page: 0,
      size: 2000
    };
    if (claseVueloId) {
      params['claseVueloId'] = claseVueloId;
    }
    return this.listar(params).pipe(map((p) => p?.content ?? []));
  }
}

