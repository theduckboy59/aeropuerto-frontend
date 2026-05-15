import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { JwtService } from '../services/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = this.authService.getToken();

    if (!token || this.jwtService.isTokenExpired(token)) {
      this.router.navigate(['/login'], {
        queryParams: {
          reason: 'expired',
          attempted: state.url
        }
      });
      return false;
    }

    // Si la ruta requiere roles específicos
    if (route.data && route.data['roles']) {
      const requiredRoles = route.data['roles'] as string[];
      const userRole = this.jwtService.getRole(token);

      if (!userRole || !requiredRoles.includes(userRole)) {
        this.router.navigate(['/menu'], {
          queryParams: {
            reason: 'role',
            attempted: state.url,
            role: userRole || ''
          }
        });
        return false;
      }
    }

    return true;
  }
}
