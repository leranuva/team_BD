# team_BD

Plataforma interna para la gestión operativa de una empresa constructora.

Esta fase deja el cimiento: aplicación web, PostgreSQL, identidad, concesiones explícitas y auditoría de solo inserción. Todavía no hay fichajes, obras, incidencias, periodos ni informes.

El paquete npm se llama `team_bd` porque el registro exige minúsculas.

## Qué hay

- Next.js y React, con TypeScript estricto.
- PostgreSQL, Drizzle y migraciones en `drizzle/`.
- Vitest para la autorización y para la migración.
- Sesión en cookie `HttpOnly`. La contraseña se guarda con Argon2id.
- `Employee` y `User` separados. Un usuario puede no tener empleado.
- Los roles `ADMIN`, `SUPERVISOR` y `EMPLOYEE` solo etiquetan la interfaz.
- Una operación se autoriza con una concesión vigente. Sin concesión, se deniega.
- `audit_events` rechaza modificaciones, borrados y vaciados.
- `company_time_settings` existe y no contiene ninguna zona horaria.

## Requisitos

- Node.js 20.9 o posterior. Este desarrollo usa Node 26.
- PostgreSQL 16. El archivo `docker-compose.yml` lo publica en `127.0.0.1:5433`.

La contraseña de esa base es solo para la máquina local.

## Puesta en marcha

```powershell
npm ci
Copy-Item .env.example .env
docker compose up -d
npm run db:migrate
```

`DATABASE_URL` es obligatoria para migrar, arrancar y crear el administrador.

Crea la primera cuenta con concesiones explícitas. El rol de administración no abre paso por sí solo:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "cambia-esta-clave"
npm run admin:create
```

La contraseña necesita al menos 12 caracteres. El script no la escribe en el registro de auditoría.

```powershell
npm run dev
```

Abre `http://127.0.0.1:3000`.

## Comprobaciones

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
```

La prueba de integración usa PostgreSQL y crea una base temporal:

```powershell
npm run test:integration
```

## Fuera de esta fase

Fichajes, obras, supervisores, delegaciones, incidencias, cierres semanales, rectificaciones, materiales y logística.
