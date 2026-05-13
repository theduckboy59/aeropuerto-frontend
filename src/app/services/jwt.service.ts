import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() { }

  /**
   * Decodifica un JWT y extrae el payload
   */
  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const decoded = JSON.parse(atob(parts[1]));
      return decoded;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Extrae el rol del token
   */
  getRole(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.role || null;
  }

  /**
   * Extrae el username del token
   */
  getUsername(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.sub || null;
  }

  /**
   * Verifica si el token está expirado
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const expiryTime = decoded.exp * 1000;
      return Date.now() >= expiryTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Obtiene todos los datos del token
   */
  getTokenData(token: string): any {
    return this.decodeToken(token);
  }
}
