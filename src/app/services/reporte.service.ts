import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface FiltrosVuelosReporte {
  fechaDesde?: string | null;
  horaDesde?: string | null;
  fechaHasta?: string | null;
  horaHasta?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly api = `${environment.apiUrl}/reportes`;
  private readonly consultasApi = `${environment.apiUrl}/consultas`;

  constructor(
    private http: HttpClient
  ) {}

  consultaVueloPublica(codigoVuelo: string) {
    return this.http.get<any>(
      `${this.consultasApi}/vuelo/${encodeURIComponent(codigoVuelo)}`
    );
  }

  consultaVuelo(codigoVuelo: string) {
    return this.http.get<any>(
      `${this.api}/consulta-vuelo/${encodeURIComponent(codigoVuelo)}`
    );
  }

  consultaVueloPdf(codigoVuelo: string) {
    return this.http.get(
      `${this.api}/consulta-vuelo/${encodeURIComponent(codigoVuelo)}/pdf`,
      { responseType: 'blob' }
    );
  }

  vuelosPorFechaHora(filtros: FiltrosVuelosReporte) {
    return this.http.get<any[]>(
      `${this.api}/vuelos`,
      { params: this.params(filtros) }
    );
  }

  vuelosPdf(filtros: FiltrosVuelosReporte) {
    return this.http.get(
      `${this.api}/vuelos/pdf`,
      {
        params: this.params(filtros),
        responseType: 'blob'
      }
    );
  }

  vuelosExcel(filtros: FiltrosVuelosReporte) {
    return this.http.get(
      `${this.api}/vuelos/excel`,
      {
        params: this.params(filtros),
        responseType: 'blob'
      }
    );
  }

  pasajerosPorVuelo(codigoVuelo: string) {
    return this.http.get<any[]>(
      `${this.api}/pasajeros-vuelo/${encodeURIComponent(codigoVuelo)}`
    );
  }

  pasajerosPorVueloPdf(codigoVuelo: string) {
    return this.http.get(
      `${this.api}/pasajeros-vuelo/${encodeURIComponent(codigoVuelo)}/pdf`,
      { responseType: 'blob' }
    );
  }

  pasajerosPorVueloExcel(codigoVuelo: string) {
    return this.http.get(
      `${this.api}/pasajeros-vuelo/${encodeURIComponent(codigoVuelo)}/excel`,
      { responseType: 'blob' }
    );
  }

  equipajePorVuelo(codigoVuelo: string) {
    return this.http.get<any[]>(
      `${this.api}/equipaje-vuelo/${encodeURIComponent(codigoVuelo)}`
    );
  }

  equipajePorVueloPdf(codigoVuelo: string) {
    return this.http.get(
      `${this.api}/equipaje-vuelo/${encodeURIComponent(codigoVuelo)}/pdf`,
      { responseType: 'blob' }
    );
  }

  equipajePorVueloExcel(codigoVuelo: string) {
    return this.http.get(
      `${this.api}/equipaje-vuelo/${encodeURIComponent(codigoVuelo)}/excel`,
      { responseType: 'blob' }
    );
  }

  avionesPorAerolinea(aerolineaId: number) {
    return this.http.get<any[]>(
      `${this.api}/aviones-aerolinea/${aerolineaId}`
    );
  }

  avionesPorAerolineaPdf(aerolineaId: number) {
    return this.http.get(
      `${this.api}/aviones-aerolinea/${aerolineaId}/pdf`,
      { responseType: 'blob' }
    );
  }

  avionesPorAerolineaExcel(aerolineaId: number) {
    return this.http.get(
      `${this.api}/aviones-aerolinea/${aerolineaId}/excel`,
      { responseType: 'blob' }
    );
  }

  aerolineasPorAeropuerto(aeropuertoId: number) {
    return this.http.get<any[]>(
      `${this.api}/aerolineas-aeropuerto/${aeropuertoId}`
    );
  }

  aerolineasPorAeropuertoPdf(aeropuertoId: number) {
    return this.http.get(
      `${this.api}/aerolineas-aeropuerto/${aeropuertoId}/pdf`,
      { responseType: 'blob' }
    );
  }

  aerolineasPorAeropuertoExcel(aeropuertoId: number) {
    return this.http.get(
      `${this.api}/aerolineas-aeropuerto/${aeropuertoId}/excel`,
      { responseType: 'blob' }
    );
  }

  destinosPorAerolinea(aerolineaId: number) {
    return this.http.get<any[]>(
      `${this.api}/destinos-aerolinea/${aerolineaId}`
    );
  }

  destinosPorAerolineaPdf(aerolineaId: number) {
    return this.http.get(
      `${this.api}/destinos-aerolinea/${aerolineaId}/pdf`,
      { responseType: 'blob' }
    );
  }

  destinosPorAerolineaExcel(aerolineaId: number) {
    return this.http.get(
      `${this.api}/destinos-aerolinea/${aerolineaId}/excel`,
      { responseType: 'blob' }
    );
  }

  private params(data: any): HttpParams {
    let params = new HttpParams();

    Object.entries(data || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params = params.set(key, String(value).trim());
      }
    });

    return params;
  }
}
