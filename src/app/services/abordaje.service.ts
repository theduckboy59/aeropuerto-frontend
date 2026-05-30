import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AbordajeEquipajeRequest {
  numeroMaleta?: number | null;
  peso?: number | null;
}

export interface AbordajeRequest {
  vueloOperadoId: number;
  segmentoOperadoId?: number | null;
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
  segmentoActualOrden?: number | null;
  cantidadSegmentos?: number | null;

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

export interface AbordajeVueloPendienteResponse {
  vueloOperadoId: number;

  segmentoOperadoId: number;
  ordenSegmento?: number | null;
  segmentoActualOrden?: number | null;
  cantidadSegmentos?: number | null;

  tipoSegmentoVuelo?: string | null;

  codigoVuelo?: string | null;
  aerolineaId?: number | null;

  aeropuertoSalidaId?: number | null;
  aeropuertoSalidaNombre?: string | null;
  aeropuertoSalidaCodigoIata?: string | null;

  aeropuertoLlegadaId?: number | null;
  aeropuertoLlegadaNombre?: string | null;
  aeropuertoLlegadaCodigoIata?: string | null;

  fechaSalida?: string | null;
  horaSalida?: string | null;

  estadoVuelo?: string | null;
}

export interface FinalizarAbordajeResponse {
  vueloOperadoId?: number | null;

  segmentoOperadoId?: number | null;
  ordenSegmento?: number | null;
  segmentoActualOrden?: number | null;
  cantidadSegmentos?: number | null;

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

  listarVuelosPendientes(
    aerolineaId: number
  ): Observable<AbordajeVueloPendienteResponse[]> {
    const params = new HttpParams()
      .set('aerolineaId', String(aerolineaId));

    return this.http.get<AbordajeVueloPendienteResponse[]>(
      `${this.api}/vuelos-pendientes`,
      { params }
    );
  }

  buscar(paramsInput: {
    vueloOperadoId: number;
    pasaporte: string;
    segmentoOperadoId?: number | null;
  }): Observable<AbordajeResponse> {
    let params = new HttpParams()
      .set('vueloOperadoId', String(paramsInput.vueloOperadoId))
      .set('pasaporte', paramsInput.pasaporte);

    if (paramsInput.segmentoOperadoId) {
      params = params.set('segmentoOperadoId', String(paramsInput.segmentoOperadoId));
    }

    return this.http.get<AbordajeResponse>(
      `${this.api}/buscar`,
      { params }
    );
  }

  registrar(
    request: AbordajeRequest
  ): Observable<AbordajeResponse> {
    return this.http.patch<AbordajeResponse>(
      `${this.api}/registrar`,
      request
    );
  }

  finalizar(
    vueloOperadoId: number,
    segmentoOperadoId?: number | null
  ): Observable<FinalizarAbordajeResponse> {
    let params = new HttpParams();

    if (segmentoOperadoId) {
      params = params.set('segmentoOperadoId', String(segmentoOperadoId));
    }

    return this.http.patch<FinalizarAbordajeResponse>(
      `${this.api}/vuelo/${vueloOperadoId}/finalizar`,
      null,
      { params }
    );
  }
}