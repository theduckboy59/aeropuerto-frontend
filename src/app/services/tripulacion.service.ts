import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface TripulacionPayload {
  aerolineaId: number;
  pilotoId: number;
  copilotoId: number;
  ingenieroId: number;
  tripulantesCabinaIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class TripulacionService {
  private api = `${environment.apiUrl}/tripulaciones`;

  constructor(private http: HttpClient) {}

  crearTripulacion(data: TripulacionPayload) {
    return this.http.post(this.api, data);
  }

  actualizarTripulacion(id: number, data: TripulacionPayload) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  getTripulaciones() {
    return this.http.get<any[]>(this.api);
  }

  getTripulacionesByAerolinea(aerolineaId: number) {
    return this.http.get<any[]>(`${this.api}/aerolinea/${aerolineaId}`);
  }

  getTripulacionesDisponibles(aerolineaId: number) {
    return this.http.get<any[]>(`${this.api}/disponibles/${aerolineaId}`);
  }

  getTripulacionesPage(filters: Record<string, any> = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<any>(`${this.api}/page`, { params });
  }

  getTripulacion(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  actualizarEstado(id: number, estadoId: number) {
    return this.http.put(`${this.api}/${id}/estado/${estadoId}`, {});
  }
}