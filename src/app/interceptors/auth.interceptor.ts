import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // URLs públicas que no requieren autenticación
  private publicUrls = [
    '/auth/login',
    '/auth/register',
    '/catalogos/',
    '/vuelos/consulta/'
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // No interceptar URLs públicas
    if (this.isPublicUrl(req.url)) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    let clonedReq = req;

    if (token) {
      clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {

        if (error.status === 401) {
          // Token expirado o inválido
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: {
              reason: 'unauthorized',
              attempted: req.url
            }
          });
        } else if (error.status === 403) {
          // Acceso denegado por roles
          this.router.navigate(['/menu'], {
            queryParams: {
              reason: 'forbidden',
              attempted: req.url,
              role: this.authService.getRole() || ''
            }
          });
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si la URL es pública
   */
  private isPublicUrl(url: string): boolean {
    return this.publicUrls.some(publicUrl => url.includes(publicUrl));
  }
}
