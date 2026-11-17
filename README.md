# cursor-typescript-template

Plantilla base de TypeScript para desarrollar con Cursor. Deja listos el compilador, el análisis estático, el formato, la normalización de saltos de línea y las reglas del editor.

No depende de un framework. El único módulo de partida es `src/index.ts`.

## Alcance y limitaciones

- `src/index.ts` declara un mensaje y lo escribe en la consola. No implementa una aplicación.
- `tsconfig.json` usa `noEmit: true`. La comprobación de tipos no genera JavaScript.
- El compilador incluye únicamente `src/**/*.ts`.
- No hay aplicación backend, React ni Next.js, ni tampoco sus dependencias.
- No hay framework de pruebas ni script para ejecutarlas.
- `package.json` declara `"main": "index.js"`, pero ese archivo no está en el repositorio.
- No existe un archivo `LICENSE`.

## Características

### TypeScript

`tsconfig.json` activa `strict`, `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`. El destino es ES2022, los módulos y su resolución son `NodeNext`, y los tipos incluidos son los de Node mediante `@types/node`. `package.json` declara `"type": "module"`.

### ESLint

`eslint.config.mjs` es una configuración plana. Incorpora las reglas recomendadas de ESLint y de `typescript-eslint`. En `**/*.ts` y `**/*.tsx` usa los globales de Node, marca `@typescript-eslint/no-explicit-any` como error y permite argumentos o variables no usados cuando su nombre empieza por `_`. Ignora `node_modules/**` y `dist/**`.

### Prettier

`.prettierrc.json` usa punto y coma, comillas dobles, coma final en todas las posiciones, dos espacios, ancho de 100 columnas y finales de línea LF.

`.prettierignore` excluye `node_modules/`, `dist/`, `coverage/`, `.next/`, `*.tsbuildinfo` y `package-lock.json`.

### Reglas de desarrollo para Cursor

Las reglas están en `.cursor/rules/*.mdc`. Solo `00-project-context.mdc` se aplica en toda conversación. Las otras cinco tienen `alwaysApply: false` y entran según el contexto de la tarea.

### Git y saltos de línea

`.gitignore` excluye dependencias, salidas de compilación, cobertura, archivos `.env`, logs y archivos locales del editor o del sistema operativo.

`.gitattributes` trata el texto con `text=auto` y fuerza LF en TypeScript, JavaScript, JSON, Markdown, MDC y YAML. Los formatos de imagen y PDF quedan marcados como binarios.

## Requisitos previos

- Node.js y npm. El proyecto no declara `engines`, así que no hay una versión mínima fijada en la configuración.
- Cursor, como editor recomendado para cargar las reglas de `.cursor/rules/`.
- Git, para clonar el repositorio y controlar los cambios.

## Instalación

El repositorio es privado. Para clonarlo hace falta permiso de lectura y autenticación.

```bash
git clone https://github.com/leranuva/cursor-typescript-template.git
cd cursor-typescript-template
npm ci
```

`npm ci` instala las versiones registradas en `package-lock.json`.

Abre después la carpeta del proyecto en Cursor. Si el comando `cursor` está disponible en la terminal:

```bash
cursor .
```

## Comandos disponibles

Estos son los únicos scripts definidos en `package.json`:

| Script         | Comando                | Finalidad                                                          |
| -------------- | ---------------------- | ------------------------------------------------------------------ |
| `typecheck`    | `npm run typecheck`    | Ejecuta `tsc --noEmit` y comprueba los tipos sin generar archivos. |
| `lint`         | `npm run lint`         | Ejecuta `eslint .`.                                                |
| `lint:fix`     | `npm run lint:fix`     | Ejecuta `eslint . --fix` y aplica correcciones automáticas.        |
| `format`       | `npm run format`       | Ejecuta `prettier --write .` y aplica el formato.                  |
| `format:check` | `npm run format:check` | Ejecuta `prettier --check .` sin modificar archivos.               |

## Estructura del proyecto

```text
cursor-typescript-template/
├── .cursor/
│   └── rules/
│       ├── 00-project-context.mdc
│       ├── 10-typescript.mdc
│       ├── 20-backend.mdc
│       ├── 30-react-nextjs.mdc
│       ├── 40-testing.mdc
│       └── 50-security.mdc
├── src/
│   └── index.ts
├── .gitattributes
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.mjs
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

`node_modules/` aparece después de instalar las dependencias y Git lo ignora.

## Reglas de Cursor

### Regla general

`00-project-context.mdc` tiene `alwaysApply: true`. Pide inspeccionar el repositorio antes de modificarlo, seguir la arquitectura existente, mantener un alcance reducido, usar TypeScript estricto, validar entradas no confiables, proteger secretos, cubrir con pruebas los cambios de comportamiento, ejecutar las comprobaciones disponibles y resumir los archivos modificados.

### Reglas por contexto

Ninguna de estas reglas se aplica de forma permanente:

- `10-typescript.mdc` se asocia a `**/*.ts` y `**/*.tsx`. Prioriza el modo estricto, `unknown` para datos no confiables, uniones discriminadas, validación en tiempo de ejecución y la reutilización de tipos. Rechaza `any` en datos no confiables, aserciones inseguras y directivas `@ts-ignore` sin una razón local.
- `20-backend.mdc` se activa por su descripción al trabajar en APIs, validación, autenticación, autorización, transacciones, idempotencia o acceso a datos. Exige usar el framework y el ORM que ya estén instalados. Esta plantilla no incluye ninguno.
- `30-react-nextjs.mdc` se activa por su descripción al trabajar en componentes React, estado, hooks, accesibilidad, rendimiento y estados de carga o error. Las indicaciones de Next.js solo corresponden cuando Next.js está instalado.
- `40-testing.mdc` se activa por su descripción al añadir o modificar pruebas. Pide usar el framework ya configurado y escribir pruebas deterministas de comportamiento observable, regresión e integración. También impide afirmar que una prueba pasó si no se ejecutó.
- `50-security.mdc` se activa por su descripción en cambios que cruzan límites de confianza o tratan autenticación, autorización, inyección, XSS, CSRF, SSRF, secretos y operaciones destructivas o de producción.

## Calidad del código

Comprueba tipos, análisis estático y formato con:

```bash
npm run typecheck
npm run lint
npm run format:check
```

Las correcciones automáticas disponibles son:

```bash
npm run lint:fix
npm run format
```

## Uso como plantilla

1. Clona este repositorio privado, o copia su contenido, como punto de partida de otro proyecto.
2. Cambia `name` y `description` en `package.json`.
3. Sustituye `src/index.ts` por el código nuevo.
4. Añade dependencias y scripts cuando el proyecto los necesite.
5. Conserva la configuración de TypeScript, ESLint, Prettier, Git y `.cursor/rules/` mientras siga siendo adecuada.

Las reglas de backend, React y pruebas describen cómo trabajar si más adelante se incorporan esas piezas. No instalan una aplicación ni un framework de pruebas.

## Licencia

`package.json` declara `"license": "ISC"`.

No existe un archivo `LICENSE` con el texto de esa licencia.
