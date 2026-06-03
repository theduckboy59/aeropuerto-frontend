import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { JwtService } from '../services/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.authorize(route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.authorize(route, state);
  }

  private authorize(
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

    const requiredRoles = this.getRequiredRoles(route);

    if (requiredRoles.length) {
      const userRole = this.jwtService.getRole(token);

      if (!userRole || !requiredRoles.includes(userRole)) {
        const landingRoute = this.authService.getLandingRouteForRole(userRole);

        this.router.navigate([landingRoute || '/login'], {
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

  private getRequiredRoles(route: ActivatedRouteSnapshot): string[] {
    for (let i = route.pathFromRoot.length - 1; i >= 0; i--) {
      const roles = route.pathFromRoot[i].data?.['roles'] as string[] | undefined;

      if (roles?.length) {
        return roles;
      }
    }

    return [];
  }
}
