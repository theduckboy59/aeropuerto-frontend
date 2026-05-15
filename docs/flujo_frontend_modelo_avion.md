# FLUJO FRONTEND CRUD - MODELO AVIÓN
**Proyecto:** Aeropuerto Los Primos

---

## OBJETIVO
Implementar el CRUD completo de Modelo Avión en Angular, conectado al backend existente.
Modelo Avión funciona como catálogo técnico para registrar aviones y posteriormente generar asientos.
Por ahora NO se implementa preview visual ni generación de asiento_ubi desde esta pantalla.

---

## 1. RUTAS FRONTEND

### Menú:
```
Aerolínea → Operación Aérea → Modelos de avión
```

### Rutas Angular esperadas:

| Operación | Ruta | Componente |
|-----------|------|-----------|
| **Listado** | `/menu/aerolinea/modelo-avion` | `ModeloAvionComponent` |
| **Crear** | `/menu/aerolinea/modelo-avion/nuevo` | `ModeloAvionCreateComponent` |
| **Editar** | `/menu/aerolinea/modelo-avion/editar/:id` | `ModeloAvionEditComponent` |

**Ejemplos:**
```
/menu/aerolinea/modelo-avion
/menu/aerolinea/modelo-avion/nuevo
/menu/aerolinea/modelo-avion/editar/5
```

---

## 2. ARCHIVOS FRONTEND

### Componentes:

**1) Listado:**
- `src/app/pages/modelo-avion/modelo-avion.component.ts`
- `src/app/pages/modelo-avion/modelo-avion.component.html`
- `src/app/pages/modelo-avion/modelo-avion.component.css`

**2) Crear:**
- `src/app/pages/modelo-avion-create/modelo-avion-create.component.ts`
- `src/app/pages/modelo-avion-create/modelo-avion-create.component.html`
- `src/app/pages/modelo-avion-create/modelo-avion-create.component.css`

**3) Editar:**
- `src/app/pages/modelo-avion-edit/modelo-avion-edit.component.ts`
- `src/app/pages/modelo-avion-edit/modelo-avion-edit.component.html`
- `src/app/pages/modelo-avion-edit/modelo-avion-edit.component.css`

### Service:
```
src/app/services/modelo-avion.service.ts
```

### Routing:
```
src/app/app-routing.module.ts
```

### Menú:
```
src/app/pages/menu/menu.component.html
```

### Módulo:
```
src/app/app.module.ts
```

---

## 3. APP MODULE

Los componentes se crearon **SIN standalone**, deben estar declarados en `app.module.ts`.

### Imports necesarios:
```typescript
import { FormsModule } from '@angular/forms';
import { ModeloAvionComponent } from './pages/modelo-avion/modelo-avion.component';
import { ModeloAvionCreateComponent } from './pages/modelo-avion-create/modelo-avion-create.component';
import { ModeloAvionEditComponent } from './pages/modelo-avion-edit/modelo-avion-edit.component';
```

### En `@NgModule`:
```typescript
@NgModule({
  declarations: [
    // ... otros componentes
    ModeloAvionComponent,
    ModeloAvionCreateComponent,
    ModeloAvionEditComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ]
})
```

---

## 4. APP ROUTING MODULE

### Imports necesarios en `src/app/app-routing.module.ts`:
```typescript
import { ModeloAvionComponent } from './pages/modelo-avion/modelo-avion.component';
import { ModeloAvionCreateComponent } from './pages/modelo-avion-create/modelo-avion-create.component';
import { ModeloAvionEditComponent } from './pages/modelo-avion-edit/modelo-avion-edit.component';
```

### Rutas dentro de children de `/menu`:
```typescript
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
}
```

**IMPORTANTE:** No usar `loadComponent` porque estos componentes **NO son standalone**.

---

## 5. MENÚ

Archivo: `src/app/pages/menu/menu.component.html`

Dentro de: **Aerolínea → Operación Aérea**

Agregar antes de Gestión Avión:
```html
<a
  class="nav-item sub"
  routerLink="/menu/aerolinea/modelo-avion"
  routerLinkActive="active">
  Modelos de avión
</a>
```

---

## 6. ENDPOINTS BACKEND

### Base URL desde Angular:
```typescript
environment.apiUrl
```

### Service Angular:
```typescript
private api = `${environment.apiUrl}/modelo-avion`;
```

**Ejemplo:** Si `environment.apiUrl = http://localhost:8080`

### URLs reales:

| Operación | Método | Endpoint | Ejemplo |
|-----------|--------|----------|---------|
| **Listar modelos** | GET | `/modelo-avion` | `GET http://localhost:8080/modelo-avion` |
| **Listar con búsqueda** | GET | `/modelo-avion?q=boeing&size=100` | `GET http://localhost:8080/modelo-avion?q=boeing&size=100` |
| **Obtener por ID** | GET | `/modelo-avion/{id}` | `GET http://localhost:8080/modelo-avion/5` |
| **Crear modelo** | POST | `/modelo-avion` | `POST http://localhost:8080/modelo-avion` |
| **Editar modelo** | PUT | `/modelo-avion/{id}` | `PUT http://localhost:8080/modelo-avion/5` |
| **Inactivar modelo** | PATCH | `/modelo-avion/{id}/estado?estadoId=2` | `PATCH http://localhost:8080/modelo-avion/5/estado?estadoId=2` |

---

## 7. LO QUE EL BACKEND ESPERA PARA CREAR

### Endpoint:
```
POST /modelo-avion
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer <token>   // si SecurityConfig protege el endpoint
```

### Body esperado:
```json
{
  "fabricante": "Boeing",
  "codigoModelo": "737-800",
  "nombre": "Boeing 737-800",
  "niveles": 1,
  "pasillos": 1,
  "configuracion": "3-3",
  "totalColumnas": 6,
  "filasMin": 20,
  "filasMax": 35,
  "estadoId": 1
}
```

### Campos:

| Campo | Tipo | Obligatorio | Ejemplo | Notas |
|-------|------|-----------|---------|-------|
| `fabricante` | String | Sí | Boeing, Airbus, Embraer | Texto obligatorio |
| `codigoModelo` | String | Sí | 737-800, A320, E190 | Código único |
| `nombre` | String | Sí | Boeing 737-800 | Nombre descriptivo |
| `niveles` | Number | Sí | 1 o 2 | Valores válidos: 1 o 2 |
| `pasillos` | Number | Sí | 1 o 2 | Debe coincidir con configuración |
| `configuracion` | String | Sí | 3-3, 3-4-3, 2-2 | Números separados por guion |
| `totalColumnas` | Number | Sí | 6, 10, 4 | Suma de configuración |
| `filasMin` | Number | Sí | 20 | Mayor que 0 |
| `filasMax` | Number | Sí | 35 | Mayor o igual a filasMin |
| `estadoId` | Number | No | 1 | Para crear, enviar 1 |

### Validaciones backend esperadas:

- `fabricante`: Texto no vacío
- `codigoModelo`: Texto no vacío, debe ser único
- `nombre`: Texto no vacío
- `niveles`: 1 o 2
- `pasillos`: Mayor a 0
- `configuracion`: Formato válido (números separados por guion)
- `totalColumnas`: Suma de la configuración
- `filasMin`: Mayor a 0
- `filasMax`: Mayor o igual a filasMin
- `pasillos`: Debe coincidir con cantidad de bloques - 1

---

## 8. LO QUE EL BACKEND ESPERA PARA EDITAR

### Endpoint:
```
PUT /modelo-avion/{id}
```

**Ejemplo:**
```
PUT /modelo-avion/5
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer <token>
```

### Body esperado:
```json
{
  "fabricante": "Boeing",
  "codigoModelo": "737-800",
  "nombre": "Boeing 737-800",
  "niveles": 1,
  "pasillos": 1,
  "configuracion": "3-3",
  "totalColumnas": 6,
  "filasMin": 20,
  "filasMax": 35,
  "estadoId": 1
}
```

### IMPORTANTE:
- El ID **NO va dentro del body**
- El ID **va en la URL**

✅ **Correcto:**
```
PUT /modelo-avion/5
Body: { fabricante: "Boeing", ... }
```

❌ **Incorrecto:**
```
PUT /modelo-avion
Body: { id: 5, fabricante: "Boeing", ... }
```

---

## 9. LO QUE EL BACKEND DEVUELVE

### Obtener un modelo:
```json
{
  "id": 1,
  "fabricante": "Boeing",
  "codigoModelo": "737-800",
  "nombre": "Boeing 737-800",
  "niveles": 1,
  "pasillos": 1,
  "configuracion": "3-3",
  "totalColumnas": 6,
  "filasMin": 20,
  "filasMax": 35,
  "estadoId": 1
}
```

### Listar (paginado):
```json
{
  "content": [
    {
      "id": 1,
      "fabricante": "Boeing",
      "codigoModelo": "737-800",
      "nombre": "Boeing 737-800",
      "niveles": 1,
      "pasillos": 1,
      "configuracion": "3-3",
      "totalColumnas": 6,
      "filasMin": 20,
      "filasMax": 35,
      "estadoId": 1
    }
  ],
  "pageable": {},
  "totalElements": 1,
  "totalPages": 1,
  "size": 100,
  "number": 0
}
```

### En el frontend:
El service debe extraer: `res.content ?? []`

Por eso `getModelos()` debe retornar `ModeloAvion[]` y no `Page` completo.

---

## 10. SERVICE ANGULAR ESPERADO

Archivo: `src/app/services/modelo-avion.service.ts`

### Métodos principales:

```typescript
// 1. Listar modelos (con filtros opcionales)
getModelos(filters: Record<string, any> = {}): Observable<ModeloAvion[]>

// 2. Obtener modelo por ID
getModelo(id: number): Observable<ModeloAvion>

// 3. Crear nuevo modelo
crearModelo(data: ModeloAvionRequest): Observable<ModeloAvion>

// 4. Actualizar modelo
actualizarModelo(id: number, data: ModeloAvionRequest): Observable<ModeloAvion>

// 5. Cambiar estado (inactivar)
cambiarEstado(id: number, estadoId: number): Observable<void>
```

---

## 11. FLUJO DE LISTADO

### Pantalla:
```
src/app/pages/modelo-avion/modelo-avion.component.*
```

### Ruta:
```
GET /modelo-avion?size=100
```

### Al entrar:

1. Ejecutar `ngOnInit()`
2. Llamar `cargar()`
3. `cargar()` llama: `this.service.getModelos(this.filtros)`
4. Guardar respuesta en: `modelos: ModeloAvion[]`
5. Mostrar tabla

### Columnas visibles:

| Columna | Campo | Ejemplo |
|---------|-------|---------|
| Fabricante | `fabricante` | Boeing |
| Código | `codigoModelo` | 737-800 |
| Nombre | `nombre` | Boeing 737-800 |
| Niveles | `niveles` | 1 |
| Pasillos | `pasillos` | 1 |
| Configuración | `configuracion` | 3-3 |
| Columnas | `totalColumnas` | 6 |
| Filas | `filasMin` a `filasMax` | 20 a 35 |
| Capacidad ref. | Calculado | 120 a 210 |
| Acciones | Editar, Inactivar | - |

### NO mostrar:

- `id`
- `estadoId`
- `createdAt`
- `updatedAt`

*El id solo se usa internamente para editar o inactivar.*

### Cálculo de Capacidad de referencia:

```typescript
min = filasMin * totalColumnas * niveles
max = filasMax * totalColumnas * niveles
```

**Ejemplo:**
```
filasMin = 20
filasMax = 35
totalColumnas = 6
niveles = 1

Capacidad ref. = 120 a 210
```

---

## 12. FLUJO DE BÚSQUEDA

### Filtro visible:

**Buscar:** (fabricante, código o nombre)

### El frontend debe mandar:

```
GET /modelo-avion?q=boeing&size=100
```

### Botones:

| Botón | Acción |
|-------|--------|
| **Buscar** | Ejecuta `cargar()` |
| **Limpiar** | Reinicia filtros y ejecuta `cargar()` |

**Reiniciar filtros:**
```typescript
{
  q: '',
  size: 100
}
```

---

## 13. FLUJO DE CREAR

### Ruta frontend:
```
/menu/aerolinea/modelo-avion/nuevo
```

### Endpoint backend:
```
POST /modelo-avion
```

### Formulario:

| Campo | Obligatorio | Tipo | Ejemplo |
|-------|------------|------|---------|
| Fabricante | * | Text | Boeing |
| Código modelo | * | Text | 737-800 |
| Nombre | * | Text | Boeing 737-800 |
| Niveles | * | Number | 1 |
| Pasillos | * | Number | 1 |
| Configuración | * | Text | 3-3 |
| Total columnas | * | Number | 6 |
| Filas mínimas | * | Number | 20 |
| Filas máximas | * | Number | 35 |

### Botones:

| Botón | Acción |
|-------|--------|
| **Guardar** | Valida y envía POST |
| **Cancelar** | Regresa al listado |

### Flujo de Guardar:

1. Validar formulario
2. Si hay error: mostrar `alert(mensaje)`
3. Si está bien: enviar `POST /modelo-avion`
4. Si responde correctamente:
   - `alert('Modelo de avión creado correctamente')`
   - Navegar a `/menu/aerolinea/modelo-avion`
5. Si hay error: mostrar `alert(mensajeError)`

---

## 14. VALIDACIONES FRONTEND PARA CREAR Y EDITAR

### Validaciones obligatorias:

```
1. Fabricante obligatorio
2. Código modelo obligatorio
3. Nombre obligatorio
4. Niveles obligatorio
5. Pasillos obligatorio
6. Configuración obligatoria
7. Total columnas obligatorio
8. Filas mínimas obligatorio
9. Filas máximas obligatorio
```

### Validaciones numéricas:

```
1. niveles debe ser 1 o 2
2. pasillos debe ser mayor a 0
3. totalColumnas debe ser mayor a 0
4. filasMin debe ser mayor a 0
5. filasMax debe ser mayor o igual que filasMin
```

### Validación de configuración:

**Formato válido:**
```
/^[0-9]+(-[0-9]+)*$/
```

**Ejemplos válidos:**
```
3-3
3-4-3
2-2
1-1
1-2
```

**Ejemplos inválidos:**
```
3x3
3/3
A-B
3--3
-3-3
```

### Validación de columnas:

**La suma de los bloques debe coincidir con totalColumnas.**

**Ejemplos:**
```
3-3:
  suma = 6
  totalColumnas debe ser 6 ✓

3-4-3:
  suma = 10
  totalColumnas debe ser 10 ✓

2-2:
  suma = 4
  totalColumnas debe ser 4 ✓
```

### Validación de pasillos:

**La cantidad de pasillos debe coincidir con: cantidad de bloques - 1**

**Ejemplos:**
```
3-3:
  bloques = 2
  pasillos = 1 ✓

3-4-3:
  bloques = 3
  pasillos = 2 ✓

2-2:
  bloques = 2
  pasillos = 1 ✓
```

---

## 15. FLUJO DE EDITAR

### Ruta frontend:
```
/menu/aerolinea/modelo-avion/editar/:id
```

**Ejemplo:**
```
/menu/aerolinea/modelo-avion/editar/5
```

### Endpoints backend:

```
1. Cargar datos:    GET /modelo-avion/5
2. Guardar cambios: PUT /modelo-avion/5
```

### Flujo:

1. Capturar `id` desde `ActivatedRoute`
2. Validar que `id` sea un número válido
3. Si no es válido:
   - `alert('ID inválido')`
   - Regresar al listado
4. Llamar `GET /modelo-avion/{id}`
5. Llenar formulario con datos
6. Usuario modifica datos
7. Al guardar:
   - Validar igual que crear
   - Enviar `PUT /modelo-avion/{id}`
8. Si responde correctamente:
   - `alert('Modelo de avión actualizado correctamente')`
   - Navegar a `/menu/aerolinea/modelo-avion`

---

## 16. FLUJO DE INACTIVAR

### NO se usa DELETE

**Botón:** Inactivar

### Endpoint backend:
```
PATCH /modelo-avion/{id}/estado?estadoId=2
```

**Ejemplo:**
```
PATCH /modelo-avion/5/estado?estadoId=2
```

### Flujo:

1. Usuario presiona "Inactivar"
2. Frontend muestra: `confirm('¿Inactivar modelo de avión?')`
3. Si confirma:
   - Llamar `cambiarEstado(id, 2)`
4. Si responde correctamente:
   - `alert('Modelo inactivado')`
   - Recargar listado
5. Si hay error:
   - Mostrar mensaje de error

### Notas:

- NO mostrar `estadoId` en tabla
- NO mostrar `id` en tabla
- NO usar DELETE

---

## 17. PREVIEW

### Endpoint:
```
POST /modelo-avion/preview
```

### Por ahora:
**NO se usa en frontend**

### Qué hace:
Devuelve una vista previa de bloques de asientos según la configuración.

### Ejemplo request:
```json
{
  "fabricante": "Boeing",
  "codigoModelo": "737-800",
  "nombre": "Boeing 737-800",
  "niveles": 1,
  "pasillos": 1,
  "configuracion": "3-3",
  "totalColumnas": 6,
  "filasMin": 20,
  "filasMax": 35,
  "estadoId": 1
}
```

### Ejemplo response:
```json
{
  "niveles": [
    {
      "nivel": 1,
      "bloques": [
        ["A", "B", "C"],
        ["D", "E", "F"]
      ]
    }
  ],
  "totalColumnas": 6,
  "pasillos": 1
}
```

**Nota:** No es necesario para el CRUD actual. Se puede agregar más adelante para mostrar visualmente la configuración.

---

## 18. RELACIÓN CON AVIÓN

**Modelo Avión se usa como catálogo al crear Avión.**

En crear avión:
```
src/app/pages/avion-create/avion-create.component.ts
```

Se usa:
```typescript
this.modeloService.getModelos({ size: 100 })
```

### IMPORTANTE:

`getModelos()` debe retornar `ModeloAvion[]`

**NO** debe retornar `Page` completo porque puede romper el módulo de Crear Avión.

### Modelo Avión define:

- `niveles`
- `pasillos`
- `configuración`
- `totalColumnas`
- `filasMin`
- `filasMax`

### Avión usa:

- `modeloAvionId`
- `filasConfiguradas`

### Más adelante:

`asiento_ubi` usará:
```
filasConfiguradas * totalColumnas * niveles
```

*Pero esa parte queda fuera del CRUD actual.*

---

## 19. SECURITY CONFIG

Para que el frontend pueda usar este CRUD, el backend debe permitir o proteger correctamente: `/modelo-avion/**`

### Si está público durante desarrollo:

```java
.requestMatchers("/modelo-avion/**").permitAll()
```

### Si está protegido:

```java
.requestMatchers("/modelo-avion/**").hasRole("ADMIN_AEROLINEA")
```

### En caso de estar protegido:

El frontend debe enviar token JWT en Authorization:
```
Authorization: Bearer <token>
```

Si ya existe `AuthInterceptor`, no hay que tocar nada más siempre que el token esté guardado correctamente.

---

## 20. ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| **Can't bind to ngModel** | Falta `FormsModule` en `app.module.ts` | Agregar `import { FormsModule }` y en `imports` |
| **No aparece en menú** | Falta link en `menu.component.html` | Agregar `routerLink="/menu/aerolinea/modelo-avion"` |
| **Ruta no funciona** | Falta ruta en `app-routing.module.ts` | Agregar rutas con `component`, NO `loadComponent` |
| **Error 404** | URL mal escrita o endpoint no existe | Revisar: `/modelo-avion` no `/modelo-aviones` |
| **Crear avión deja de cargar modelos** | `getModelos()` retorna `Page` completo | `getModelos()` debe retornar `res.content ?? []` |
| **Error al inactivar** | Endpoint PATCH no coincide | Usar `PATCH /modelo-avion/{id}/estado?estadoId=2` |
| **Error de validación** | Configuración no coincide | Validar: `3-3` → totalColumnas 6, pasillos 1 |

---

## 21. RESUMEN FINAL

### El CRUD de Modelo Avión debe hacer:

| Operación | Método | Endpoint |
|-----------|--------|----------|
| **Listar** | GET | `/modelo-avion?size=100` |
| **Buscar** | GET | `/modelo-avion?q=boeing&size=100` |
| **Crear** | POST | `/modelo-avion` |
| **Editar** | GET/PUT | `/modelo-avion/{id}` |
| **Inactivar** | PATCH | `/modelo-avion/{id}/estado?estadoId=2` |

### NO debe mostrar:
- `id`
- `estadoId`

### NO debe usar:
- DELETE
- Preview (todavía)

### Debe mantener:
`getModelos()` retornando arreglo para no romper módulo de Crear Avión

---

**Documento generado:** Mayo 13, 2026
**Estado:** ✅ COMPLETO
