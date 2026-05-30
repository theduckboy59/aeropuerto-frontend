import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AbordajeBuscarParams {
  vueloOperadoId: number;
  pasaporte: string;
}

export interface AbordajeEquipajeRequest {
  numeroMaleta?: number | null;
  peso?: number | null;
}

export interface AbordajeRequest {
  vueloOperadoId: number;
  pasaporte: string;
  cantidadMaletasPresentadas: number;
  equipajes?: AbordajeEquipajeRequest[];
  empleadoId?: number | null;
  tipoAbordaje?: string | null;
}

export interface AbordajeResponse {
  boletoId?: number | null;
  codigoBoleto?: string | null;
  codigoPaseAbordar?: string | null;

  pasajeroId?: number | null;
  nombrePasajero?: string | null;
  pasaporte?: string | null;

  vueloOperadoId?: number | null;
  boletoSegmentoId?: number | null;
  segmentoOperadoId?: number | null;
  ordenSegmento?: number | null;

  estadoBoleto?: string | null;
  estadoBoletoSegmento?: string | null;
  asiento?: string | null;

  cantidadMaletasRegistradas?: number | null;
  cantidadMaletasPresentadas?: number | null;

  recargoEquipaje?: number | null;
  requierePagoRecargo?: boolean | null;
  pagoRecargoId?: number | null;
  estadoPagoRecargo?: string | null;

  total?: number | null;
  mensaje?: string | null;
}

export interface FinalizarAbordajeResponse {
  vueloOperadoId?: number | null;
  estadoVuelo?: string | null;
  boletosAbordados?: number | null;
  boletosCancelados?: number | null;
  mensaje?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AbordajeService {
  private api = `${environment.apiUrl}/abordaje`;

  constructor(private http: HttpClient) {}

  buscar(paramsIn: AbordajeBuscarParams): Observable<AbordajeResponse> {
    const params = new HttpParams()
      .set('vueloOperadoId', String(paramsIn.vueloOperadoId))
      .set('pasaporte', String(paramsIn.pasaporte).trim());

    return this.http.get<AbordajeResponse>(`${this.api}/buscar`, { params });
  }

  registrar(request: AbordajeRequest): Observable<AbordajeResponse> {
    return this.http.patch<AbordajeResponse>(`${this.api}/registrar`, request);
  }

  finalizar(vueloOperadoId: number): Observable<FinalizarAbordajeResponse> {
    return this.http.patch<FinalizarAbordajeResponse>(
      `${this.api}/vuelo/${vueloOperadoId}/finalizar`,
      null
    );
  }
}