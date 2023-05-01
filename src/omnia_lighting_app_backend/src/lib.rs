use candid::{CandidType, Deserialize, Nat};
use ic_cdk::{
    api::{
        management_canister::http_request::{
            http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext,
        },
        stable::{StableReader, StableWriter},
    },
    init, post_upgrade, pre_upgrade, print, update,
};
use outcalls::transform_device_response;
use rdf::uuid::generate_uuid;
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
}

/// Sends a toggle request to the device.
#[update]
async fn send_toggle_command_to_device(device_url: DeviceUrl) -> Result<(), GenericError> {
    // load previously fetched devices
    let devices = WOT_DEVICES.with(|cell| cell.borrow_mut().clone());
    // get the device requested
    let device = devices
        .get(&device_url)
        .ok_or_else(|| "Device not found".to_string())?;
    let mut request_headers: Vec<HttpHeader> = device
        .clone()
        .headers
        .into_iter()
        .map(|(k, v)| HttpHeader { name: k, value: v })
        .collect();

    request_headers.push(
        // the Idempotent-Key is required to avoid flooding the device (aka Gateway) with the same query from all the replicas
        HttpHeader {
            name: "Idempotent-Key".to_string(),
            value: generate_uuid().await.to_string(),
        },
    );

    // here we should parse the device Thing Description to get the correct endpoint
    // for now, we assume we already know it since we fetched the device with that capability
    let url = format!("{}/actions/6", device_url);

    // same for the body, we should parse the TD to get the correct body structure and format the request accordingly
    let body = r#"{
        "command": {
            "id": 2
        }
    }"#;

    // same for the method
    let method = HttpMethod::POST;

    // prepare the HTTP outcall request
    let request = CanisterHttpRequestArgument {
        url,
        method,
        body: Some(body.into()),
        max_response_bytes: Some(2048), // 2KB
        transform: Some(TransformContext::new(transform_device_response, vec![])),
        headers: request_headers,
    };

    // toggle the device by sending the request
    match http_request(request).await {
        Ok((response,)) => {
            // needed just to avoid clippy warnings
            #[allow(clippy::cmp_owned)]
            if response.status >= Nat::from(200) && response.status < Nat::from(400) {
                let message =
                    format!("The http_request resulted into success. Response: {response:?}");
                print(message);
                Ok(())
            } else {
                let message =
                    format!("The http_request resulted into error. Response: {response:?}");
                print(message.clone());
                Err(message)
            }
        }
        Err((r, m)) => {
            let message =
                format!("The http_request resulted into error. RejectionCode: {r:?}, Error: {m}");
            print(message.clone());

            Err(message)
        }
    }
}
