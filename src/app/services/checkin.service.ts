import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckInRequest {
  boletoId?: number | null;
  codigoPaseAbordar?: string | null;
  vueloOperadoId?: number | null;
  pasaporte?: string | null;
  tipoCheckin?: string | null;
  empleadoId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CheckInService {
  private api = `${environment.apiUrl}/checkin`;

  constructor(private http: HttpClient) {}

  realizar(request: CheckInRequest): Observable<any> {
    return this.http.post<any>(this.api, request);
  }

  consultarPorBoleto(boletoId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/boleto/${boletoId}`);
  }

  consultarPorPase(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.api}/pase/${encodeURIComponent(codigo)}`);
  }
}

