extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation, Events as _, Ledger},
    Event, IntoVal, Symbol,
};

fn setup() -> (Env, LibroVisitasClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(LibroVisitas, ());
    let client = LibroVisitasClient::new(&env, &id);
    (env, client)
}

#[test]
fn libro_empieza_vacio() {
    let (_env, client) = setup();
    assert_eq!(client.total(), 0);
    assert_eq!(client.listar().len(), 0);
}

#[test]
fn firmar_y_listar() {
    let (env, client) = setup();
    env.ledger().with_mut(|l| {
        l.sequence_number = 42;
        l.timestamp = 1_700_000_000;
    });
    let ana = Address::generate(&env);
    let beto = Address::generate(&env);

    let hola = String::from_str(&env, "¡Salud desde la cantina!");
    assert_eq!(client.firmar(&ana, &hola), 0);
    assert_eq!(client.firmar(&beto, &String::from_str(&env, "gm")), 1);

    let firmas = client.listar();
    assert_eq!(firmas.len(), 2);
    let primera = firmas.get(0).unwrap();
    assert_eq!(primera.autor, ana);
    assert_eq!(primera.mensaje, hola);
    assert_eq!(primera.ledger, 42);
    assert_eq!(primera.timestamp, 1_700_000_000);
    assert_eq!(firmas.get(1).unwrap().autor, beto);
    assert_eq!(client.total(), 2);
    assert_eq!(client.firma_de(&ana), Some(primera));
}

#[test]
fn firmar_exige_la_auth_del_autor() {
    let (env, client) = setup();
    let ana = Address::generate(&env);
    let msg = String::from_str(&env, "hola");
    client.firmar(&ana, &msg);

    assert_eq!(
        env.auths(),
        std::vec![(
            ana.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    client.address.clone(),
                    Symbol::new(&env, "firmar"),
                    (ana.clone(), msg).into_val(&env),
                )),
                sub_invocations: std::vec![],
            }
        )]
    );
}

#[test]
#[should_panic]
fn sin_auth_no_se_puede_firmar() {
    let env = Env::default();
    let id = env.register(LibroVisitas, ());
    let client = LibroVisitasClient::new(&env, &id);
    client.firmar(&Address::generate(&env), &String::from_str(&env, "suplantación"));
}

#[test]
fn una_firma_por_direccion() {
    let (env, client) = setup();
    let ana = Address::generate(&env);
    client.firmar(&ana, &String::from_str(&env, "primera"));
    let otra = client.try_firmar(&ana, &String::from_str(&env, "segunda"));
    assert_eq!(otra, Err(Ok(Error::YaFirmaste)));
    assert_eq!(client.total(), 1);
}

#[test]
fn valida_el_mensaje() {
    let (env, client) = setup();
    let ana = Address::generate(&env);
    assert_eq!(
        client.try_firmar(&ana, &String::from_str(&env, "")),
        Err(Ok(Error::MensajeVacio))
    );
    let largo = "a".repeat(MAX_MENSAJE as usize + 1);
    assert_eq!(
        client.try_firmar(&ana, &String::from_str(&env, &largo)),
        Err(Ok(Error::MensajeMuyLargo))
    );
    let justo = "a".repeat(MAX_MENSAJE as usize);
    assert!(client.try_firmar(&ana, &String::from_str(&env, &justo)).is_ok());
}

#[test]
fn emite_evento_al_firmar() {
    let (env, client) = setup();
    let ana = Address::generate(&env);
    let msg = String::from_str(&env, "evento!");
    client.firmar(&ana, &msg);

    let esperado = NuevaFirma {
        autor: ana,
        id: 0,
        mensaje: msg,
    };
    assert_eq!(
        env.events().all().filter_by_contract(&client.address),
        std::vec![esperado.to_xdr(&env, &client.address)]
    );
}

#[test]
fn paginacion() {
    let (env, client) = setup();
    for i in 0..5 {
        let msg = String::from_str(&env, &std::format!("firma {i}"));
        client.firmar(&Address::generate(&env), &msg);
    }
    let pagina = client.listar_pagina(&1, &2);
    assert_eq!(pagina.len(), 2);
    assert_eq!(pagina.get(0).unwrap().id, 1);
    assert_eq!(pagina.get(1).unwrap().id, 2);
    assert_eq!(client.listar_pagina(&4, &10).len(), 1);
    assert_eq!(client.listar_pagina(&9, &10).len(), 0);
    assert_eq!(client.listar_pagina(&0, &u32::MAX).len(), 5);
}
