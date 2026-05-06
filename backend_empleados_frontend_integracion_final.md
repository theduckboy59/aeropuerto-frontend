# Backend Empleados - Integración Frontend (Actualización Final)

## Estado actual

El módulo empleados ya soporta:

- CRUD completo
- Soft delete
- Validaciones backend
- DTO Response
- Password encriptada
- Manejo errores JSON
- Generación automática código empleado
- Filtros backend combinados
- Specifications JPA
- Validaciones anti NullPointerException

---

# Endpoints

Base:
```text
http://localhost:8080
```

---

## Registro empleado

```http
POST /register
```

---

## Listado empleados

```http
GET /empleados
```

---

## Obtener empleado

```http
GET /empleados/{id}
```

---

## Actualizar empleado

```http
PUT /empleados/{id}
```

---

## Eliminar empleado

```http
DELETE /empleados/{id}
```

Soft delete:

```text
estadoId = 2
```

---

# Filtros backend soportados

Endpoint:

```http
GET /empleados
```

Query params:

```text
tipoEmpleadoId
aerolineaId
fechaIngreso
fechaSalida
turnoId
rolId
nivelAccesoId
areaId
```

---

# Filtros combinados

Ahora TODOS pueden combinarse.

Ejemplo:

```http
GET /empleados?tipoEmpleadoId=1&turnoId=2&rolId=3
```

Backend aplica:

```text
tipoEmpleadoId = 1
AND turnoId = 2
AND rolId = 3
```

---

# Más ejemplos

## Tipo + aerolínea

```http
GET /empleados?tipoEmpleadoId=1&aerolineaId=2
```

---

## Área + rol

```http
GET /empleados?areaId=1&rolId=2
```

---

## Nivel acceso + turno

```http
GET /empleados?nivelAccesoId=1&turnoId=3
```

---

## Fecha ingreso + área

```http
GET /empleados?fechaIngreso=2026-05-06&areaId=2
```

---

# EstadoId siempre activo

Ahora listar(...) siempre parte de:

```text
findByEstadoId(1)
```

Entonces:

```text
siempre devuelve empleados activos
```

aunque existan filtros.

---

# Cambios realizados en EmpleadoServiceImpl.java

## listar(...)

Antes:

```text
if / else if
```

solo aplicaba un filtro.

Ahora:

```text
todos los filtros se aplican juntos
```

mediante:

```text
Specification<Empleado>
```

---

## validarRequest(...)

Ahora recibe:

```java
validarRequest(request, requirePassword)
```

---

# Registro

En crear(...):

```java
validarRequest(request, true)
```

Password obligatorio.

---

# Actualización

En actualizar(...):

```java
validarRequest(request, false)
```

Password opcional.

---

# Validaciones nuevas

## Password null

Ya no genera:

```text
NullPointerException
```

---

## tipoEmpleadoId null

Ahora validado antes de:

```java
generarCodigoEmpleado(...)
```

Evita:

```text
NullPointerException
```

---

# Arquitectura filtros

Se usa:

```text
JpaSpecificationExecutor
Specification<Empleado>
```

Filtros dinámicos profesionales.

---

# Repository actualizado

```java
extends JpaRepository<Empleado, Integer>,
        JpaSpecificationExecutor<Empleado>
```

---

# Body esperado POST/PUT

```json
{
  "username": "juan",
  "email": "juan@test.com",
  "password": "Password123",

  "tipoEmpleadoId": 1,
  "aerolineaId": 1,

  "nombreCompleto": "Juan Perez",

  "fechaIngreso": "2026-05-05",

  "turnoId": 1,
  "nivelAccesoId": 1,
  "rolId": 1,
  "areaId": 1,

  "licenciaId": 1,
  "fechaVencimientoLicencia": "2027-01-01"
}
```

---

# Respuesta backend

```json
{
  "id": 1,
  "userId": 1,

  "username": "juan",
  "email": "juan@test.com",

  "tipoEmpleadoId": 1,
  "aerolineaId": 1,

  "codigoEmpleado": "PIL-0001",
  "nombreCompleto": "Juan Perez",

  "fechaIngreso": "2026-05-05",

  "turnoId": 1,
  "nivelAccesoId": 1,
  "rolId": 1,
  "areaId": 1,

  "licenciaId": 1,

  "fechaVencimientoLicencia": "2027-01-01",

  "estadoId": 1
}
```

---

# Prefijos automáticos

```text
1 -> PIL
2 -> COP
3 -> CAB
4 -> ING
default -> EMP
```

Ejemplos:

```text
PIL-0001
COP-0001
CAB-0001
ING-0001
EMP-0001
```

---

# Importante frontend

NO enviar:

```text
codigoEmpleado
```

Backend lo genera automáticamente.

---

# Manejo errores frontend

Respuesta backend:

```json
{
  "status": 400,
  "message": "Email ya registrado",
  "timestamp": "2026-05-05T21:00:00"
}
```

Angular:

```ts
error: (err) => {
  alert(err.error.message);
}
```

---

# Archivos backend modificados

```text
EmpleadoRepository.java
EmpleadoService.java
EmpleadoServiceImpl.java
EmpleadoController.java
EmpleadoRequest.java
EmpleadoResponse.java
GlobalExceptionHandler.java
```

---

# Arquitectura

## User
Login/autenticación.

## Empleado
Datos operativos aeropuerto.

## DisponibilidadEmpleado
Disponibilidad operacional futura.


tomar en cuenta: Aqui tienes toda la informacion para implementar el CRUD de empleados, con generacion de codigo, catalogos y actualizacion.

Base URL (dev)

http://localhost:8080
1) Registro de empleado (creacion)

Endpoint: POST /register
Archivo: EmpleadoController.java:1-63
Como se genera el codigo: el backend lo genera automaticamente segun tipoEmpleadoId. No lo envias desde el front.
Ejemplo request:

{
  "username": "jlopez",
  "email": "jlopez@empresa.com",
  "password": "MiClaveSegura1",
  "tipoEmpleadoId": 1,
  "aerolineaId": 2,
  "nombreCompleto": "Juan Lopez",
  "fechaIngreso": "2026-05-06",
  "fechaSalida": null,
  "turnoId": 1,
  "nivelAccesoId": 2,
  "rolId": 3,
  "areaId": 4,
  "licenciaId": 1,
  "fechaVencimientoLicencia": "2027-05-06"
}
Ejemplo response (resumen):
{
  "id": 10,
  "userId": 22,
  "username": "jlopez",
  "email": "jlopez@empresa.com",
  "tipoEmpleadoId": 1,
  "aerolineaId": 2,
  "codigoEmpleado": "PIL-0007",
  "nombreCompleto": "Juan Lopez",
  "fechaIngreso": "2026-05-06",
  "fechaSalida": null,
  "turnoId": 1,
  "nivelAccesoId": 2,
  "rolId": 3,
  "areaId": 4,
  "licenciaId": 1,
  "fechaVencimientoLicencia": "2027-05-06",
  "estadoId": 1
}

Boton “Generar codigo” en front

No necesitas un endpoint separado.
El codigo se genera automaticamente en backend con tipoEmpleadoId.
Sugerencia UI: cuando el usuario seleccione tipoEmpleadoId, puedes mostrar un texto “Se generara automaticamente al guardar”.
2) Listado de empleados

Endpoint: GET /empleados
Soporta filtros combinados (query params):
tipoEmpleadoId
aerolineaId
fechaIngreso (YYYY-MM-DD)
fechaSalida (YYYY-MM-DD)
turnoId
rolId
nivelAccesoId
areaId
Ejemplo:

3) Obtener un empleado

Endpoint: GET /empleados/{id}
4) Actualizar empleado

Endpoint: PUT /empleados/{id}
Igual que registro, pero password es opcional.
Si no mandas password, no se cambia la clave.
Ejemplo:
{
  "username": "jlopez",
  "email": "jlopez@empresa.com",
  "password": "",
  "tipoEmpleadoId": 1,
  "aerolineaId": 2,
  "nombreCompleto": "Juan Lopez",
  "fechaIngreso": "2026-05-06",
  "fechaSalida": null,
  "turnoId": 1,
  "nivelAccesoId": 2,
  "rolId": 3,
  "areaId": 4,
  "licenciaId": 1,
  "fechaVencimientoLicencia": "2027-05-06"
}

5) Eliminar empleado (borrado logico)

Endpoint: DELETE /empleados/{id}
Cambia estadoId a 2 (no borra fisico).
Catalogos (para combos en front)

Base: GET /catalogos/*
Archivos: CatalogoController.java:1-60
Endpoints:

GET /catalogos/status
GET /catalogos/aerolinea
GET /catalogos/tipo-empleado
GET /catalogos/turno
GET /catalogos/nivel-acceso
GET /catalogos/rol
GET /catalogos/area
GET /catalogos/licencia
Si quieres, te preparo:

Coleccion de Postman.
Ejemplo de formulario front (campos y validaciones).
Flujo de pantallas (listar, crear, editar, detalle).
