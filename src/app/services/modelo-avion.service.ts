import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Page } from './shared/page';

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

@Injectable({
  providedIn: 'root'
})
export class ModeloAvionService {
  private api = `${environment.apiUrl}/modelo-avion`;

  constructor(private http: HttpClient) {}

  getModelos(params: { page?: number; size?: number; q?: string } = {}) {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') httpParams = httpParams.set(k, String(v));
    });

    return this.http.get<Page<ModeloAvion>>(this.api, { params: httpParams }).pipe(
      map((res) => res?.content ?? [])
    );
  }
}

