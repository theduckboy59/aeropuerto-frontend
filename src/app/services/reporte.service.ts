import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private consultasApi = `${environment.apiUrl}/consultas`;
  private reportesApi = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  consultaVueloPublica(codigoVuelo: string): Observable<any> {
    return this.http.get<any>(`${this.consultasApi}/vuelo/${encodeURIComponent(codigoVuelo)}`);
  }

  vuelosPorFechaHora(paramsIn: Record<string, any>): Observable<any[]> {
    let params = new HttpParams();
    Object.entries(paramsIn).forEach(([k, v]) => {
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        params = params.set(k, String(v).trim());
      }
    });
    return this.http.get<any[]>(`${this.reportesApi}/vuelos`, { params });
  }

  pasajerosPorVuelo(codigoVuelo: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.reportesApi}/pasajeros-vuelo/${encodeURIComponent(codigoVuelo)}`
    );
  }

  equipajePorVuelo(codigoVuelo: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.reportesApi}/equipaje-vuelo/${encodeURIComponent(codigoVuelo)}`
    );
  }

  avionesPorAerolinea(aerolineaId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.reportesApi}/aviones-aerolinea/${aerolineaId}`
    );
  }

  aerolineasPorAeropuerto(aeropuertoId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.reportesApi}/aerolineas-aeropuerto/${aeropuertoId}`
    );
  }

  destinosPorAerolinea(aerolineaId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.reportesApi}/destinos-aerolinea/${aerolineaId}`
    );
  }
}

