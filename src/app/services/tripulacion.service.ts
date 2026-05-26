import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripulacionService {

  private api = `${environment.apiUrl}/tripulaciones`;

  constructor(private http: HttpClient) {}

  findAll(filters: Record<string, any> = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<any>(`${this.api}/page`, { params });
  }

  listar() {
    return this.http.get<any[]>(this.api);
  }

  getTripulaciones() {
    return this.listar();
  }

  obtenerPorId(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  getTripulacion(id: number) {
    return this.obtenerPorId(id);
  }

  listarPorAerolinea(aerolineaId: number) {
    return this.http.get<any[]>(`${this.api}/aerolinea/${aerolineaId}`);
  }

  getTripulacionesByAerolinea(aerolineaId: number) {
    return this.listarPorAerolinea(aerolineaId);
  }

  listarDisponibles(aerolineaId: number) {
    return this.http.get<any[]>(`${this.api}/disponibles/${aerolineaId}`);
  }

  crear(data: any) {
    return this.http.post<any>(this.api, data);
  }

  crearTripulacion(data: any) {
    return this.crear(data);
  }

  crearEmpleado(data: any) {
    return this.crear(data);
  }

  actualizar(id: number, data: any) {
    return this.http.put<any>(`${this.api}/${id}`, data);
  }

  actualizarTripulacion(id: number, data: any) {
    return this.actualizar(id, data);
  }

  actualizarEstado(id: number, estadoId: number) {
    return this.http.put<any>(`${this.api}/${id}/estado/${estadoId}`, {});
  }
}