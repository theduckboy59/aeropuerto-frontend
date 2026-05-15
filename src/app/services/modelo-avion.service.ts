import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ModeloAvion {
  id: number;
  fabricante: string;
  codigoModelo: string;
  nombre: string;
  niveles: number;
  pasillos: number;
  configuracion: string;
  totalColumnas: number;
  filasMin: number;
  filasMax: number;
  estadoId: number;
}

export interface ModeloAvionRequest {
  fabricante: string;
  codigoModelo: string;
  nombre: string;
  niveles: number;
  pasillos: number;
  configuracion: string;
  totalColumnas: number;
  filasMin: number;
  filasMax: number;
  estadoId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ModeloAvionService {
  private api = `${environment.apiUrl}/modelo-avion`;

  constructor(private http: HttpClient) {}

  getModelos(filters: Record<string, any> = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    // Backend normalmente retorna un Page<T>, pero en algunos entornos puede venir como arreglo directo.
    return this.http.get<any>(this.api, { params }).pipe(
      map((res) => {
        if (Array.isArray(res)) return res as ModeloAvion[];
        if (Array.isArray(res?.content)) return res.content as ModeloAvion[];
        if (Array.isArray(res?.data)) return res.data as ModeloAvion[];
        return [] as ModeloAvion[];
      })
    );
  }

  getModelo(id: number) {
    return this.http.get<ModeloAvion>(`${this.api}/${id}`);
  }

  crearModelo(data: ModeloAvionRequest) {
    return this.http.post<ModeloAvion>(this.api, data);
  }

  actualizarModelo(id: number, data: ModeloAvionRequest) {
    return this.http.put<ModeloAvion>(`${this.api}/${id}`, data);
  }

  cambiarEstado(id: number, estadoId: number) {
    const params = new HttpParams().set('estadoId', String(estadoId));
    return this.http.patch<void>(`${this.api}/${id}/estado`, null, { params });
  }
}
