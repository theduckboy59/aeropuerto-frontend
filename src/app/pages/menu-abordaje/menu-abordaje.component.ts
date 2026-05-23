import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationError, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu-abordaje',
  templateUrl: './menu-abordaje.component.html',
  styleUrls: ['./menu-abordaje.component.css']
})
export class MenuAbordajeComponent implements OnInit, OnDestroy {
  sidebarOpen = true;
  diagnosticMessage = '';
  sessionInfo = '';

  private subscriptions = new Subscription();

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateSessionInfo();

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const reason = params.get('reason');
        const attempted = params.get('attempted');
        const role = params.get('role');

        this.diagnosticMessage = this.buildDiagnosticMessage(reason, attempted, role);
      })
    );

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd || event instanceof NavigationError))
        .subscribe((event) => {
          this.updateSessionInfo();

          if (event instanceof NavigationError) {
            this.diagnosticMessage = `No se pudo cargar la ventana: ${event.error?.message || event.error || 'error de navegacion'}`;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  private updateSessionInfo(): void {
    const token = this.auth.getToken();
    const role = this.auth.getRole();

    if (!token) {
      this.sessionInfo = 'No hay token guardado.';
      return;
    }

    this.sessionInfo = role
      ? `Sesion activa. Rol detectado: ${role}.`
      : 'Sesion activa, pero no se pudo detectar el rol del token.';
  }

  private buildDiagnosticMessage(
    reason: string | null,
    attempted: string | null,
    role: string | null
  ): string {
    if (!reason) {
      return '';
    }

    if (reason === 'expired') {
      return 'No se cargo la ventana porque el token no existe o ya expiro. Inicia sesion otra vez.';
    }

    if (reason === 'role') {
      const roleInfo = role ? ` Rol actual: ${role}.` : ' No se detecto rol en el token.';
      const routeInfo = attempted ? ` Ruta solicitada: ${attempted}.` : '';
      return `No se cargo la ventana porque tu rol no tiene permiso para esa ruta.${roleInfo}${routeInfo}`;
    }

    if (reason === 'unauthorized') {
      return 'El backend respondio 401. El token fue rechazado o vencio; inicia sesion otra vez.';
    }

    if (reason === 'forbidden') {
      return 'El backend respondio 403. Tu usuario inicio sesion, pero no tiene permisos para esa accion.';
    }

    return 'No se pudo cargar la ventana. Revisa permisos, token o endpoint del backend.';
  }
}