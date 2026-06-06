import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PortalComponent } from './pages/portal/portal.component';
import { LoginComponent } from './pages/login/login.component';
import { MenuComponent } from './pages/menu/menu.component';
import { MenuAbordajeComponent } from './pages/menu-abordaje/menu-abordaje.component';
import { MenuClienteComponent } from './pages/menu-cliente/menu-cliente.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { EmpleadoFormComponent } from './pages/empleado-form/empleado-form.component';
import { EmpleadoEditComponent } from './pages/empleado-edit/empleado-edit.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TripulacionComponent } from './pages/tripulacion/tripulacion.component';
import { TripulacionCreateComponent } from './pages/tripulacion-create/tripulacion-create.component';
import { TripulacionEditComponent } from './pages/tripulacion-edit/tripulacion-edit.component';
import { AerolineasComponent } from './pages/aerolineas/aerolineas.component';
import { AerolineaCreateComponent } from './pages/aerolinea-create/aerolinea-create.component';
import { AerolineaEditComponent } from './pages/aerolinea-edit/aerolinea-edit.component';
import { AeropuertosComponent } from './pages/aeropuertos/aeropuertos.component';
import { AeropuertoCreateComponent } from './pages/aeropuerto-create/aeropuerto-create.component';
import { AeropuertoEditComponent } from './pages/aeropuerto-edit/aeropuerto-edit.component';
import { DestinosAutorizadosComponent } from './pages/destinos-autorizados/destinos-autorizados.component';
import { DestinoAutorizadoCreateComponent } from './pages/destino-autorizado-create/destino-autorizado-create.component';
import { DestinoAutorizadoEditComponent } from './pages/destino-autorizado-edit/destino-autorizado-edit.component';
import { AvionesComponent } from './pages/aviones/aviones.component';
import { AvionCreateComponent } from './pages/avion-create/avion-create.component';
import { AvionEditComponent } from './pages/avion-edit/avion-edit.component';
import { ConfigClaseFilasAvionComponent } from './pages/config-clase-filas-avion/config-clase-filas-avion.component';
import { ConfigClaseFilasAvionCreateComponent } from './pages/config-clase-filas-avion-create/config-clase-filas-avion-create.component';
import { ConfigClaseFilasAvionEditComponent } from './pages/config-clase-filas-avion-edit/config-clase-filas-avion-edit.component';
import { AsientoUbiComponent } from './pages/asiento-ubi/asiento-ubi.component';
import { PasajerosComponent } from './pages/pasajeros/pasajeros.component';
import { PasajeroEditComponent } from './pages/pasajero-edit/pasajero-edit.component';
import { EditPasajerosComponent } from './pages/edit-pasajeros/edit-pasajeros.component';
import { RoleGuard } from './guards/role.guard';
import { ConsultaVueloComponent } from './pages/consulta-vuelo/consulta-vuelo.component';
import { ConsultasComponent } from './pages/consultas/consultas.component';
import { ReservarVueloComponent } from './pages/reservar-vuelo/reservar-vuelo.component';
import { MisReservasComponent } from './pages/mis-reservas/mis-reservas.component';
import { AbordajeVuelosComponent } from './pages/abordaje-vuelos/abordaje-vuelos.component';

import { ModeloAvionComponent } from './pages/modelo-avion/modelo-avion.component';
import { ModeloAvionCreateComponent } from './pages/modelo-avion-create/modelo-avion-create.component';
import { ModeloAvionEditComponent } from './pages/modelo-avion-edit/modelo-avion-edit.component';

import { VuelosComponent } from './pages/vuelos/vuelos.component';
import { VueloCreateComponent } from './pages/vuelo-create/vuelo-create.component';
import { VueloEditComponent } from './pages/vuelo-edit/vuelo-edit.component';

import { VuelosOperadosComponent } from './pages/vuelos-operados/vuelos-operados.component';
import { VueloOperadoCreateComponent } from './pages/vuelo-operado-create/vuelo-operado-create.component';
import { VueloOperadoEditComponent } from './pages/vuelo-operado-edit/vuelo-operado-edit.component';

const routes: Routes = [
  { path: '', component: PortalComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'portal', component: PortalComponent },
  { path: 'consultas/vuelo', component: ConsultaVueloComponent },
  {
    path: 'abordaje',
    component: MenuAbordajeComponent,
    canActivate: [RoleGuard],
    canActivateChild: [RoleGuard],
    data: { roles: ['ROLE_ADMIN_ABORDAJE'] },
    children: [
      {
        path: '',
        redirectTo: 'vuelos/abordaje',
        pathMatch: 'full'
      },
      {
        path: 'vuelos/abordaje',
        component: AbordajeVuelosComponent,
        canActivate: [RoleGuard],
        data: { title: 'Abordaje', roles: ['ROLE_ADMIN_ABORDAJE'] }
      },
      {
        path: 'dashboard/pasajeros',
        component: PasajerosComponent,
        canActivate: [RoleGuard],
        data: { title: 'Pasajeros', roles: ['ROLE_ADMIN_ABORDAJE'] }
      },
      {
        path: 'dashboard/pasajeros/editar/:id',
        component: EditPasajerosComponent,
        canActivate: [RoleGuard],
        data: { title: 'Editar pasajero', roles: ['ROLE_ADMIN_ABORDAJE'] }
      }
    ]
  },
  {
    path: 'cliente',
    component: MenuClienteComponent,
    canActivate: [RoleGuard],
    canActivateChild: [RoleGuard],
    data: { roles: ['ROLE_CLIENTE'] },
    children: [
      {
        path: '',
        redirectTo: 'vuelos/reservar',
        pathMatch: 'full'
      },
      {
        path: 'vuelos/reservar',
        component: ReservarVueloComponent,
        canActivate: [RoleGuard],
        data: { title: 'Reservar vuelo', roles: ['ROLE_CLIENTE'] }
      },
      {
        path: 'reservas',
        component: MisReservasComponent,
        canActivate: [RoleGuard],
        data: { title: 'Mis reservas', roles: ['ROLE_CLIENTE'] }
      }
    ]
  },
  {
    path: 'menu',
    component: MenuComponent,
    canActivate: [RoleGuard],
    canActivateChild: [RoleGuard],
    data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] },
    children: [
      {
        path: '',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'consultas',
        component: ConsultasComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },

      {
        path: 'aerolinea/empleados',
        component: EmpleadosComponent,
        canActivate: [RoleGuard]},
      {
        path: 'aerolinea/empleados/nuevo',
        component: EmpleadoFormComponent,
        canActivate: [RoleGuard]},
      {
        path: 'aerolinea/empleados/editar/:id',
        component: EmpleadoEditComponent,
        canActivate: [RoleGuard]},
      {
        path: 'aerolinea/tripulacion',
        component: TripulacionComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/tripulacion/editar/:id',
        component: TripulacionEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/tripulacion/nuevo',
        component: TripulacionCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aerolineas',
        component: AerolineasComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aerolineas/nuevo',
        component: AerolineaCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aerolineas/editar/:id',
        component: AerolineaEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aeropuertos',
        component: AeropuertosComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aeropuertos/nuevo',
        component: AeropuertoCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aeropuertos/editar/:id',
        component: AeropuertoEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/destinos-autorizados',
        component: DestinosAutorizadosComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/destinos-autorizados/nuevo',
        component: DestinoAutorizadoCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/destinos-autorizados/editar/:id',
        component: DestinoAutorizadoEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aviones',
        component: AvionesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aviones/nuevo',
        component: AvionCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/aviones/editar/:id',
        component: AvionEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/asiento-ubi',
        component: AsientoUbiComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/config-clase-filas-avion',
        component: ConfigClaseFilasAvionComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/config-clase-filas-avion/nuevo',
        component: ConfigClaseFilasAvionCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/config-clase-filas-avion/editar/:id',
        component: ConfigClaseFilasAvionEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/vuelos',
        component: VuelosComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/vuelos/editar/:id',
        component: VueloEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/vuelos/nuevo',
        component: VueloCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },

      {
        path: 'dashboard/pasajeros',
        component: PasajerosComponent,
        canActivate: [RoleGuard],
        data: { title: 'Pasajeros', roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'dashboard/pasajeros/editar/:id',
        component: EditPasajerosComponent,
        canActivate: [RoleGuard],
        data: { title: 'Editar pasajero', roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'pasajeros',
        redirectTo: 'dashboard/pasajeros',
        pathMatch: 'full'
      },
      {
        path: 'pasajeros/editar/:id',
        component: PasajeroEditComponent,
        canActivate: [RoleGuard],
        data: { title: 'Editar pasajero (legacy)', roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/modelo-avion',
        component: ModeloAvionComponent
      },
      {
        path: 'aerolinea/modelo-avion/nuevo',
        component: ModeloAvionCreateComponent
      },
      {
        path: 'aerolinea/modelo-avion/editar/:id',
        component: ModeloAvionEditComponent
      },
      {
        path: 'aerolinea/vuelos-operados',
        component: VuelosOperadosComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/vuelos-operados/nuevo',
        component: VueloOperadoCreateComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      },
      {
        path: 'aerolinea/vuelos-operados/editar/:id',
        component: VueloOperadoEditComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN_AEROLINEA', 'ROLE_ADMIN_SISTEMA'] }
      }
    ]
  },
  { path: 'empleados', redirectTo: 'menu/aerolinea/empleados', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
