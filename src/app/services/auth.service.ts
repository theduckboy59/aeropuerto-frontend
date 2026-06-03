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

  private initializeUserRole(): void {
    const token = this.getToken();

    if (token && !this.jwtService.isTokenExpired(token)) {
      const role = this.jwtService.getRole(token);
      this.userRole.next(role);
    }
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/login`, data);
  }

  registerPassenger(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/register`, data);
  }

  registerEmployee(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/register`, data);
  }

  saveToken(token: string): void {
    sessionStorage.setItem('token', token);
    localStorage.removeItem('token');

    const role = this.jwtService.getRole(token);
    this.userRole.next(role);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getRole(): string | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    return this.jwtService.getRole(token);
  }

  getUsername(): string | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    return this.jwtService.getUsername(token);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    this.userRole.next(null);
  }

  isLogged(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtService.isTokenExpired(token);
  }

  hasRole(role: string): boolean {
    return this.getRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getRole();
    return userRole ? roles.includes(userRole) : false;
  }

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
