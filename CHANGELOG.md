# Changelog

Formato: una sección por versión (`## x.y.z — AAAA-MM-DD`, o `— sin publicar`
mientras se desarrolla). Flujo completo en [docs/FLUJO.md](docs/FLUJO.md).

## 1.0.0 — sin publicar

Primera versión: el libro de visitas de la Cripto Cantina para el Challenge #1
de Stellar Sessions.

### Contrato `libro-visitas`

- `firmar(autor, mensaje)` con `autor.require_auth()`: nadie puede firmar en
  nombre de otro.
- `listar()`, `listar_pagina(desde, limite)`, `total()` y `firma_de(autor)`.
- **Una firma por dirección** (`Error::YaFirmaste`) y mensajes de 1 a 280 bytes
  (`MensajeVacio`, `MensajeMuyLargo`).
- Cada firma guarda autor, mensaje, ledger y timestamp en _persistent storage_;
  el TTL se extiende ~120 días.
- Evento `NuevaFirma` (tema `"firma"`) en cada firma.
- 8 tests: auth, una firma por wallet, validaciones, eventos y paginación.

### App

- Conexión de wallet (Stellar Wallets Kit) y firma con el cliente generado.
- **Así viaja una firma**: diagrama que sigue la transacción real paso a paso
  (armar, simular, autorizar, enviar, ledger y evento), con la comisión y el
  _footprint_ de la simulación. Sin firma en curso, muestra una demo.
- **El libro**: lee `listar()` sin wallet ni comisión y se actualiza solo con el
  evento `firma`. Sellos de cera generados a partir de cada dirección.
- **Anatomía del contrato**: el código de `firmar`/`listar` con cada parte
  explicada al tocarla, lectura vs. escritura y glosario.
- Errores del contrato en español, aviso de red equivocada y botón de Friendbot
  si la cuenta no tiene XLM.

### Flujo de trabajo

- Ramas `main` / `dev_main` / `feature/x.y.z`, CHANGELOG y releases como en
  AstrOS ([docs/FLUJO.md](docs/FLUJO.md)).
- `vercel.json` + `scripts/ci-clients.mjs`: Vercel genera el cliente del
  contrato sin Rust, desde el ID de `PUBLIC_LIBRO_VISITAS_CONTRACT_ID`.
- CI en cada PR a `dev_main` y `main`: tests, `fmt` y WASM del contrato;
  typecheck, lint, formato y build de la app.

### Contrato (despliegues en testnet)

| Entorno              | Contract ID                                                |
| -------------------- | ---------------------------------------------------------- |
| Producción (`main`)  | `CASLUPVPQOKBZFWRZLOTPSE5SY56E5JS7YFW2XL7ZKIN7NFLFD2ZDOBQ` |
| Staging (`dev_main`) | `CDQPDFBMJX7GYP5N3WCOSRNO3FXUUKFVMLGTXJQD5WSRK7HMMPHN53W6` |

Mismo WASM en los dos. Sin función `upgrade`: un cambio de contrato será un
despliegue nuevo (ver docs/FLUJO.md, sección 4).

### Configuración

- Vercel → _Environment Variables_: `PUBLIC_LIBRO_VISITAS_CONTRACT_ID` con el ID
  de producción en **Production** y el de staging en **Preview**.
