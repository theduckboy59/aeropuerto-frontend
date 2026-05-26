import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private api = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) {}

  reservaPdf(reservaId: number): Observable<Blob> {
    return this.http.get(`${this.api}/reservas/${reservaId}/pdf`, {
      responseType: 'blob'
    });
  }

  boletoPdf(boletoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/boletos/${boletoId}/pdf`, {
      responseType: 'blob'
    });
  }

  facturaPorPagoPdf(pagoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/pagos/${pagoId}/factura/pdf`, {
      responseType: 'blob'
    });
  }
}

