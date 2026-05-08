import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface DestinoAutorizado {
  id: number;
  aerolineaId: number;
  aerolineaNombre?: string;
  aeropuertoId: number;
  aeropuertoNombre?: string;
  pais?: string;
  estadoId?: number;
  fechaAutorizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DestinosAutorizadosService {
  private api = `${environment.apiUrl}/destinos-autorizados`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { aerolineaId?: string | number; aeropuertoId?: string | number; pais?: string; estadoId?: string | number }) {
    let params = new HttpParams();
    const aerolineaId = (filtros?.aerolineaId ?? '').toString().trim();
    const aeropuertoId = (filtros?.aeropuertoId ?? '').toString().trim();
    const pais = (filtros?.pais ?? '').toString().trim();
    const estadoId = (filtros?.estadoId ?? '').toString().trim();

    if (aerolineaId) params = params.set('aerolineaId', aerolineaId);
    if (aeropuertoId) params = params.set('aeropuertoId', aeropuertoId);
    if (pais) params = params.set('pais', pais);
    if (estadoId) params = params.set('estadoId', estadoId);

    const options = params.keys().length ? { params } : {};
    return this.http.get<DestinoAutorizado[]>(this.api, options);
  }

  obtener(id: number) {
    return this.http.get<DestinoAutorizado>(`${this.api}/${id}`);
  }

  crear(data: { aerolineaId: number; aeropuertoId: number }) {
    return this.http.post(this.api, data);
  }

  editar(id: number, data: { aerolineaId: number; aeropuertoId: number }) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}

