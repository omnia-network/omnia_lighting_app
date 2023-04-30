use candid::{CandidType, Deserialize};
use ic_cdk::{
    api::stable::{StableReader, StableWriter},
    init, post_upgrade, pre_upgrade, print, update,
};
use rdf::{
    connection::{update_rdf_database_connection, RdfDatabaseConnection},
    send_query, GenericError, OMNIA_GRAPH,
};
use serde::Serialize;
use std::{cell::RefCell, ops::Deref};
use uuid::Uuid;

mod outcalls;
mod rdf;

#[derive(Default, CandidType, Serialize, Deserialize)]
struct State {
    pub rdf_database_connection: Option<RdfDatabaseConnection>,
    pub rand_seed: Option<[u8; 32]>,
}

thread_local! {
    /* stable */ static STATE: RefCell<State>  = RefCell::new(State::default());
}

// to deploy this canister with the database principal id as init argument, use
// dfx deploy --argument '("<rdf-database-address>", "<rdf-database-api-key>")'
#[init]
fn init(rdf_database_base_url: String) {
    print("Init canister...");
    update_rdf_database_connection(rdf_database_base_url);
}

#[pre_upgrade]
fn pre_upgrade() {
    STATE.with(|state| {
        ciborium::ser::into_writer(state.borrow().deref(), StableWriter::default())
            .expect("failed to encode state")
    })
}

#[post_upgrade]
fn post_upgrade(rdf_database_base_url: String) {
    print("Post upgrade canister...");
    STATE.with(|cell| {
        *cell.borrow_mut() =
            ciborium::de::from_reader(StableReader::default()).expect("failed to decode state");
    });
    update_rdf_database_connection(rdf_database_base_url);
}

#[update]
async fn get_devices_in_environment(environment_uid: String) -> Result<String, GenericError> {
    let environment_uid = Uuid::parse_str(&environment_uid)
        .map_err(|op| op.to_string())?
        .urn();
    let query = format!(
        r#"
        SELECT ?device ?headerName ?headerValue WHERE {{
            GRAPH {OMNIA_GRAPH} {{
                {environment_uid} bot:hasElement ?device .
                ?device td:hasPropertyAffordance saref:OnOffState .
                ?device {OMNIA_GRAPH}requiresHeader ?header .
                ?header http:fieldName ?headerName ;
                        http:fieldValue ?headerValue .
            }}
        }}"#
    );
    send_query(query).await
}
