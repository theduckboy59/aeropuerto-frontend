import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private api = `${environment.apiUrl}/auth`;
  private userRole = new BehaviorSubject<string | null>(null);
  public userRole$ = this.userRole.asObservable();

  constructor(
    private http: HttpClient,
    private jwtService: JwtService
  ) {
    this.initializeUserRole();
  }

  /**
   * Inicializa el rol del usuario desde el token guardado
   */
  private initializeUserRole(): void {
    const token = this.getToken();
    if (token && !this.jwtService.isTokenExpired(token)) {
      const role = this.jwtService.getRole(token);
      this.userRole.next(role);
    }
  }

  /**
   * Realiza login con email y contraseña
   */
  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/login`, data);
  }

  /**
   * Registra un nuevo pasajero
   */
  registerPassenger(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/register`, data);
  }

  /**
   * Registra un nuevo empleado
   */
  registerEmployee(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/register`, data);
  }

  /**
   * Guarda el token en localStorage y actualiza el rol
   */
  saveToken(token: string): void {
    localStorage.setItem('token', token);
    const role = this.jwtService.getRole(token);
    this.userRole.next(role);
  }

  /**
   * Obtiene el token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene el rol actual del usuario
   */
  getRole(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return this.jwtService.getRole(token);
  }

  /**
   * Obtiene el username del token
   */
  getUsername(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return this.jwtService.getUsername(token);
  }

  /**
   * Cierra sesión eliminando el token
   */
  logout(): void {
    localStorage.removeItem('token');
    this.userRole.next(null);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isLogged(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtService.isTokenExpired(token);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getRole();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Obtiene la ruta inicial segun el rol del usuario.
   */
  getLandingRouteForRole(role: string | null | undefined): string | null {
    switch (role) {
      case 'ROLE_ADMIN_SISTEMA':
      case 'ROLE_ADMIN_AEROLINEA':
        return '/menu';
      case 'ROLE_ADMIN_ABORDAJE':
        return '/abordaje';
      case 'ROLE_CLIENTE':
        return '/cliente';
      default:
        return null;
    }
  }
}