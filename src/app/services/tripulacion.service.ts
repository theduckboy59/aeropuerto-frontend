import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripulacionService {
  private api = `${environment.apiUrl}/tripulaciones`;

  constructor(private http: HttpClient) {}

  crearTripulacion(data: {
    aerolineaId: number;
    pilotoId: number;
    copilotoId: number;
    ingenieroId: number;
    tripulantesCabinaIds: number[];
  }) {
    return this.http.post(this.api, data);
  }

  getTripulacion(id: number) {
    return this.http.get(`${this.api}/${id}`);
  }
}
