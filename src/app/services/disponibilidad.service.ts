import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  private api = `${environment.apiUrl}/disponibilidades`;

  constructor(private http: HttpClient) {}

  getDisponibilidades() {
    return this.http.get<any[]>(this.api);
  }
}
