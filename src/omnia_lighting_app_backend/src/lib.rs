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
use wot::{DeviceUrl, WotDevices};

mod outcalls;
mod rdf;
mod wot;

#[derive(Default, CandidType, Serialize, Deserialize)]
struct State {
    pub rdf_database_connection: Option<RdfDatabaseConnection>,
}

thread_local! {
    /* stable */ static STATE: RefCell<State>  = RefCell::new(State::default());
    // we don't need to persist devices in the stable memory
    /* flexible */ static WOT_DEVICES: RefCell<WotDevices> = RefCell::new(WotDevices::default());
}

// to deploy this canister with the RDF database address as init argument, use
// dfx deploy --argument '("<rdf-database-address>")'
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
async fn get_devices_in_environment(environment_uid: String) -> Result<WotDevices, GenericError> {
    let environment_uid = Uuid::parse_str(&environment_uid)
        .map_err(|op| op.to_string())?
        .urn();
    // with this query, we get all the devices in the environment that have the toggle capability
    let query = format!(
        r#"
        SELECT ?device ?headerName ?headerValue WHERE {{
            GRAPH {OMNIA_GRAPH} {{
                {environment_uid} bot:hasElement ?device .
                ?device td:hasActionAffordance saref:ToggleCommand .
                ?device {OMNIA_GRAPH}requiresHeader ?header .
                ?header http:fieldName ?headerName ;
                        http:fieldValue ?headerValue .
            }}
        }}"#
    );
    let res = send_query(query).await?;
    print(format!("Query result: {:?}", res));

    // save the devices in the shared state, so that we can use them in the other methods
    WOT_DEVICES.with(|cell| {
        *cell.borrow_mut() = res.clone();
    });

    Ok(res)
    send_query(query).await
}
