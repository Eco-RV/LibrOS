# Flujo de trabajo: ramas, entornos, contrato y releases

El mismo flujo de AstrOS (y Finance OS), adaptado a LibrOS (Scaffold Stellar +
Vite/React + Vercel). No hay base de datos: los datos viven en el contrato
`libro-visitas` en testnet.

## 1. Ramas

| Rama                                         | Para qué                                             | Cómo entra el código                                               |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `main`                                       | Lo publicado (producción). Nunca se trabaja directo. | Solo por PR desde `dev_main`.                                      |
| `dev_main`                                   | Integración: lo que va en la próxima versión.        | PR desde las ramas de feature; docs y ajustes menores van directo. |
| `feature/<versión>` (p. ej. `feature/1.1.0`) | Una versión o feature nueva.                         | Sale de `dev_main` y vuelve por PR a `dev_main`.                   |

- Las ramas son **solo para features nuevas**. Docs, README, CHANGELOG y ajustes
  menores se commitean directo en `dev_main`.
- PRs con **merge commit** (sin squash ni rebase).
- Publicar = PR `dev_main → main` + etiqueta + release (sección 5).

```
feature/1.1.0 ──PR──▶ dev_main ──PR──▶ main ──▶ etiqueta v1.1.0 + release
     ▲                   │
     └── sale de ────────┘
```

## 2. Entornos y despliegue

Cada entorno tiene **su propia instancia del contrato** (sus propios datos):

| Entorno       | Dónde corre                                       | Contrato                                                                   |
| ------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `development` | tu computadora (`npm start`, red `local`)         | se redespliega solo al cambiar el código; datos desechables                |
| `staging`     | `dev_main` y todas las ramas (Vercel **Preview**) | `CDQPDFBMJX7GYP5N3WCOSRNO3FXUUKFVMLGTXJQD5WSRK7HMMPHN53W6` (fijo, testnet) |
| `production`  | `main` (Vercel **Production**)                    | `CASLUPVPQOKBZFWRZLOTPSE5SY56E5JS7YFW2XL7ZKIN7NFLFD2ZDOBQ` (fijo, testnet) |

Los IDs también están en `scaffold.yml` (redes `staging` y `testnet`). Para
probar en local contra staging:
`STELLAR_NETWORK=staging stellar scaffold build`. Todo es **testnet**; mainnet
solo con decisión explícita.

**Vercel** (integración de GitHub + `vercel.json`):

- Cada push a cualquier rama genera un **Preview**; cada commit en `main` va a
  **Production**.
- Vercel no tiene Rust ni el Stellar CLI. `scripts/ci-clients.mjs` genera el
  cliente TypeScript desde el contrato ya desplegado (con `stellar-js` del SDK
  de JS), según el ID de la variable de entorno. Sin esa variable, el build
  falla a propósito.
- Variables en _Project → Settings → Environment Variables_:

| Variable                            | Production                                                 | Preview                                                    |
| ----------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `PUBLIC_LIBRO_VISITAS_CONTRACT_ID`  | `CASLUPVPQOKBZFWRZLOTPSE5SY56E5JS7YFW2XL7ZKIN7NFLFD2ZDOBQ` | `CDQPDFBMJX7GYP5N3WCOSRNO3FXUUKFVMLGTXJQD5WSRK7HMMPHN53W6` |
| `PUBLIC_STELLAR_RPC_URL`            | opcional (`https://soroban-testnet.stellar.org`)           | igual                                                      |
| `PUBLIC_STELLAR_NETWORK_PASSPHRASE` | opcional (`Test SDF Network ; September 2015`)             | igual                                                      |

Nunca una clave secreta `S…`: todo `PUBLIC_*` termina en el navegador.

## 3. Chequeos (CI)

`.github/workflows/ci.yml` corre en cada PR (y push) a `dev_main` y `main`:

- **Contrato:** `cargo test`, `cargo fmt --check` y compilación a WASM.
- **App:** genera el cliente desde staging, `typecheck`, `lint`, `format:check`
  y `build`.

En local, antes de cada PR (con el cliente generado):

```bash
npm run check
npm run build
```

Recomendado en GitHub (_Settings → Branches_): regla para `dev_main` y `main`
que pida los dos checks en verde para fusionar.

## 4. Cambios en el contrato

El contrato 1.0.0 **no tiene función `upgrade`**: su código no se puede cambiar
una vez desplegado. Por eso:

- Un cambio en el contrato = **despliegue nuevo** con ID nuevo y **datos
  vacíos**. Se hace primero en staging, se prueba en `dev_main`, y después en
  producción, antes de fusionar `dev_main → main`. Hay que actualizar el ID en
  `scaffold.yml`, en las variables de Vercel, en `ci.yml`, en esta guía y en el
  README.
- Documentarlo en la sección **Contrato** del CHANGELOG: qué cambió, los IDs
  nuevos y en qué orden se desplegaron.
- Recomendado para la próxima versión que toque el contrato: agregar un `admin`
  y `upgrade(new_wasm_hash)` (como AstrOS), para que los siguientes cambios
  conserven los datos. Y no cambiar los `#[contracttype]` ya guardados: claves o
  tipos nuevos y funciones con nombre nuevo (`_v2`).

Despliegue (lo corre el dueño de la identidad `libros-deployer`, en local):

```bash
stellar contract build --package libro-visitas
stellar contract deploy --wasm target/wasm32v1-none/release/libro_visitas.wasm \
  --source libros-deployer --network testnet --alias libro-visitas-staging
```

## 5. Publicar una versión (release)

1. En la rama de la feature: subir la versión
   (`npm version 1.1.0 --no-git-tag-version`) y escribir su sección en
   `CHANGELOG.md`.
2. PR `feature/x.y.z → dev_main` y fusionar.
3. Si cambió el contrato: desplegarlo en **staging** y probar el Preview de
   `dev_main`; después en **producción** y actualizar la variable de Vercel.
4. PR `dev_main → main` y fusionar. Vercel despliega a producción.
5. Etiqueta sobre el commit de `main`:

   ```bash
   git fetch origin
   git tag -a vx.y.z origin/main -m "vx.y.z"
   git push origin vx.y.z
   ```

6. GitHub → Releases → etiqueta `vx.y.z`, título `vx.y.z — <resumen>` y como
   cuerpo la sección del CHANGELOG: qué cambió por área, **Contrato** (IDs y
   pasos) y **Configuración** (variables de Vercel, etc.).

## Checklist por versión

- [ ] Rama `feature/x.y.z` desde `dev_main`
- [ ] Cambios de contrato documentados en el CHANGELOG
- [ ] `npm run check` y `npm run build` en verde
- [ ] CHANGELOG, docs y versión en `package.json`
- [ ] PR → `dev_main`, CI y Preview de Vercel OK
- [ ] Contrato nuevo (si aplica) en staging, probado en `dev_main`
- [ ] Contrato nuevo (si aplica) en producción + variable de Vercel
- [ ] PR `dev_main` → `main` (despliega producción)
- [ ] Etiqueta `vx.y.z` + release con notas, contrato y configuración
