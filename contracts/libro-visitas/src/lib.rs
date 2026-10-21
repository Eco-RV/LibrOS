//! # Libro de visitas de la Cripto Cantina
//!
//! Cualquier wallet puede dejar **un** mensaje firmado. La firma no es un
//! simple campo de texto: `autor.require_auth()` obliga a que la transacción
//! venga autorizada por la llave privada de esa dirección, así que nadie puede
//! firmar en nombre de otro.
#![no_std]

use soroban_sdk::{
    Address, Env, String, Vec, contract, contracterror, contractevent, contractimpl, contracttype,
};

#[cfg(test)]
mod test;

/// Longitud máxima de un mensaje (en bytes UTF-8).
pub const MAX_MENSAJE: u32 = 280;

/// ~30 días de ledgers (1 ledger ≈ 5 s). Si a una entrada le quedan menos que
/// el umbral, la extendemos para que el libro no "olvide" firmas.
const DIA_EN_LEDGERS: u32 = 17_280;
const TTL_UMBRAL: u32 = 30 * DIA_EN_LEDGERS;
const TTL_EXTENDER: u32 = 120 * DIA_EN_LEDGERS;

/// Una página del libro.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Firma {
    pub id: u32,
    pub autor: Address,
    pub mensaje: String,
    /// Número de ledger en el que se escribió.
    pub ledger: u32,
    /// Timestamp (segundos Unix) del ledger.
    pub timestamp: u64,
}

/// Claves de almacenamiento.
#[contracttype]
#[derive(Clone)]
enum Clave {
    /// Número total de firmas (instance storage).
    Total,
    /// Firma número `n` (persistent storage).
    Firma(u32),
    /// Marca que una dirección ya firmó (persistent storage) → id de su firma.
    Autor(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Esta dirección ya dejó su firma. Una por wallet.
    YaFirmaste = 1,
    /// El mensaje está vacío.
    MensajeVacio = 2,
    /// El mensaje supera `MAX_MENSAJE` bytes.
    MensajeMuyLargo = 3,
}

/// Evento emitido cada vez que alguien firma. El frontend lo escucha para
/// mostrar firmas nuevas en vivo.
#[contractevent(topics = ["firma"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NuevaFirma {
    #[topic]
    pub autor: Address,
    pub id: u32,
    pub mensaje: String,
}

#[contract]
pub struct LibroVisitas;

#[contractimpl]
impl LibroVisitas {
    /// Deja un mensaje firmado en el libro. Devuelve el id de la firma.
    pub fn firmar(env: Env, autor: Address, mensaje: String) -> Result<u32, Error> {
        // 1. Autorización: la wallet de `autor` tiene que haber firmado esta
        //    invocación. Si no, la transacción entera falla aquí.
        autor.require_auth();

        // 2. Validaciones.
        let largo = mensaje.len();
        if largo == 0 {
            return Err(Error::MensajeVacio);
        }
        if largo > MAX_MENSAJE {
            return Err(Error::MensajeMuyLargo);
        }
        let persistente = env.storage().persistent();
        let clave_autor = Clave::Autor(autor.clone());
        if persistente.has(&clave_autor) {
            return Err(Error::YaFirmaste);
        }

        // 3. Escritura en el estado del contrato.
        let id = Self::total(env.clone());
        let firma = Firma {
            id,
            autor: autor.clone(),
            mensaje: mensaje.clone(),
            ledger: env.ledger().sequence(),
            timestamp: env.ledger().timestamp(),
        };
        let clave_firma = Clave::Firma(id);
        persistente.set(&clave_firma, &firma);
        persistente.set(&clave_autor, &id);
        persistente.extend_ttl(&clave_firma, TTL_UMBRAL, TTL_EXTENDER);
        persistente.extend_ttl(&clave_autor, TTL_UMBRAL, TTL_EXTENDER);

        env.storage().instance().set(&Clave::Total, &(id + 1));
        env.storage()
            .instance()
            .extend_ttl(TTL_UMBRAL, TTL_EXTENDER);

        // 4. Evento: queda registrado en el ledger y cualquiera puede leerlo.
        NuevaFirma { autor, id, mensaje }.publish(&env);

        Ok(id)
    }

    /// Devuelve todas las firmas, de la más antigua a la más reciente.
    pub fn listar(env: Env) -> Vec<Firma> {
        let total = Self::total(env.clone());
        Self::listar_pagina(env, 0, total)
    }

    /// Devuelve hasta `limite` firmas empezando en `desde`.
    pub fn listar_pagina(env: Env, desde: u32, limite: u32) -> Vec<Firma> {
        let total = Self::total(env.clone());
        let fin = desde.saturating_add(limite).min(total);
        let persistente = env.storage().persistent();
        let mut firmas = Vec::new(&env);
        for id in desde..fin {
            if let Some(firma) = persistente.get::<_, Firma>(&Clave::Firma(id)) {
                firmas.push_back(firma);
            }
        }
        firmas
    }

    /// Número total de firmas.
    pub fn total(env: Env) -> u32 {
        env.storage().instance().get(&Clave::Total).unwrap_or(0)
    }

    /// La firma de `autor`, si ya firmó.
    pub fn firma_de(env: Env, autor: Address) -> Option<Firma> {
        let persistente = env.storage().persistent();
        persistente
            .get::<_, u32>(&Clave::Autor(autor))
            .and_then(|id| persistente.get(&Clave::Firma(id)))
    }
}
