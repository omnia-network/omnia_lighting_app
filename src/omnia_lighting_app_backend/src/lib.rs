use candid::{CandidType, Deserialize, Principal};
use commands::{
    commands_interval_callback, CommandHttpArguments, CommandMetadata, DeviceCommand,
    DeviceCommands,
};
use ic_cdk::{
    api::{
        management_canister::{
            http_request::{HttpHeader, HttpMethod},
            provisional::CanisterId,
        },
        stable::{StableReader, StableWriter},
    },
    caller, init, post_upgrade, pre_upgrade, print, query, update,
};
use omnia_core_sdk::{
    access_key::{request_access_key, AccessKeyUID},
    http::get_request_headers,
    InitParams,
};
use rand::{rngs::StdRng, SeedableRng};
use random::init_rng;
use rdf::update_omnia_backend_canister_id;
use rdf::{send_query, GenericError};
use serde::Serialize;
use std::{cell::RefCell, ops::Deref, str::FromStr, time::Duration};
use utils::get_hue_from_color;
use uuid::Uuid;
use wot::{DeviceUrl, WotDevices};

mod commands;
mod outcalls;
mod random;
mod rdf;
mod utils;
mod wot;

#[derive(Default, CandidType, Serialize, Deserialize)]
struct State {
    pub omnia_backend_canister_principal: Option<Principal>,
    pub wot_devices: WotDevices,
    pub device_commands: DeviceCommands,
    pub last_valid_access_key: Option<AccessKeyUID>,
}

thread_local! {
    /* stable */ static STATE: RefCell<State>  = RefCell::new(State::default());
    // we don't need to persist the rng in the stable memory
    /* flexible */ static RNG_REF_CELL: RefCell<StdRng> = RefCell::new(SeedableRng::from_seed([0_u8; 32]));
}

fn start_commands_interval() {
    ic_cdk_timers::set_timer_interval(Duration::new(1, 0), commands_interval_callback);

    print("Started commands interval: 1 second");
}

// to deploy this canister with the Omnia Backend canister id as init argument, use
// `dfx deploy --argument '(null, "<omnia-backend-canister-id>")'`
// (the null as first argument is required by the internet identity canister)
#[init]
fn init(_: Option<String>, omnia_backend_canister_id: String, ledger_canister_id: String) {
    print("Init canister...");

    // initialize rng
    init_rng();

    update_omnia_backend_canister_id(omnia_backend_canister_id.clone());

    // initialize the omnia sdk
    RNG_REF_CELL.with(|rng_ref_cell| {
        omnia_core_sdk::init_client(InitParams {
            rng: rng_ref_cell.borrow_mut().clone(),
            omnia_canister_id: Some(
                CanisterId::from_str(&omnia_backend_canister_id)
                    .expect("failed to parse canister id"),
            ),
            ledger_canister_id: Some(
                CanisterId::from_str(&ledger_canister_id).expect("failed to parse canister id"),
            ),
        });
    });

    start_commands_interval();
}

#[pre_upgrade]
fn pre_upgrade() {
    STATE.with(|state| {
        ciborium::ser::into_writer(state.borrow().deref(), StableWriter::default())
            .expect("failed to encode state")
    })
}

#[post_upgrade]
fn post_upgrade(_: Option<String>, omnia_backend_canister_id: String) {
    print("Post upgrade canister...");

    // initialize rng
    init_rng();

    STATE.with(|cell| {
        *cell.borrow_mut() =
            ciborium::de::from_reader(StableReader::default()).expect("failed to decode state");
    });

    update_omnia_backend_canister_id(omnia_backend_canister_id);

    start_commands_interval();
}

#[update]
async fn get_devices_in_environment(environment_uid: String) -> Result<WotDevices, GenericError> {
    let environment_urn = Uuid::parse_str(&environment_uid)
        .map_err(|op| op.to_string())?
        .urn();

    // with this query, we get all the devices in the environment that have the toggle capability
    let query = format!(
        r#"
        SELECT ?device ?headerName ?headerValue WHERE {{
            {environment_urn} bot:hasElement ?device .
            ?device rdf:type saref:Device .
            ?device omnia:requiresHeader ?header .
            ?header http:fieldName ?headerName ;
                    http:fieldValue ?headerValue .
        }}"#
    );
    print(format!("Query: {}", query));

    let res = send_query(query).await?;
    print(format!("Query result: {:?}", res));

    // save the devices in the shared state, so that we can use them in the other methods
    Ok(STATE.with(|state| {
        state.borrow_mut().wot_devices = res;
        state.borrow().wot_devices.clone()
    }))
}

// used just for development purposes
// use std::collections::BTreeMap;
// use wot::DeviceHeaders;
// #[update]
// async fn get_devices_in_environment(environment_uid: String) -> Result<WotDevices, GenericError> {
//     let environment_urn = Uuid::parse_str(&environment_uid)
//         .map_err(|op| op.to_string())?
//         .urn();

//     // with this query, we get all the devices in the environment that have the toggle capability
//     let query = format!(
//         r#"
//         SELECT ?device ?headerName ?headerValue WHERE {{
//             {environment_urn} bot:hasElement ?device .
//             ?device td:hasActionAffordance saref:ToggleCommand .
//             ?device omnia:requiresHeader ?header .
//             ?header http:fieldName ?headerName ;
//                     http:fieldValue ?headerValue .
//         }}"#
//     );
//     print(format!("Query: {}", query));

//     // save the devices in the shared state, so that we can use them in the other methods
//     Ok(STATE.with(|state| {
//         let mut wot_devices = WotDevices::new();
//         wot_devices.insert(
//             String::from("https://lighting-app.free.beeceptor.com/todos"),
//             DeviceHeaders {
//                 headers: BTreeMap::from([(
//                     String::from("Accept"),
//                     String::from("application/json"),
//                 )]),
//             },
//         );
//         wot_devices.insert(
//             String::from("https://lighting-app.free.beeceptor.com/todos?bla=ble"),
//             DeviceHeaders {
//                 headers: BTreeMap::from([(
//                     String::from("Accept"),
//                     String::from("application/json"),
//                 )]),
//             },
//         );
//         state.borrow_mut().wot_devices = wot_devices.clone();
//         wot_devices
//     }))
// }

#[derive(CandidType, Serialize, Deserialize)]
struct ScheduleCommandInput {
    device_url: DeviceUrl,
    light_color: String,
}

/// Schedule a command to be sent to a device.
#[update]
async fn schedule_command(input: ScheduleCommandInput) -> Result<(), GenericError> {
    let user = caller();

    if user == Principal::anonymous() {
        return Err("User not authenticated".to_string());
    }

    let devices = STATE.with(|state| state.borrow().wot_devices.clone());
    // get the device requested
    let device = devices
        .get(&input.device_url)
        .ok_or_else(|| "Device not found".to_string())?;

    // get the current access key
    let access_key = STATE.with(|state| state.borrow().last_valid_access_key.clone());

    // if access key is not there, we need to get a new one
    let access_key = match access_key {
        Some(access_key) => access_key,
        None => {
            let access_key = request_access_key().await?;
            // store the new access key in the shared state, so that we can use it in the other calls
            STATE.with(|state| {
                state.borrow_mut().last_valid_access_key = Some(access_key.clone());
            });
            access_key
        }
    };

    // prepare the headers for the request
    let headers = get_request_headers(
        access_key,
        Some(
            device
                .clone()
                .headers
                .into_iter()
                .map(|(k, v)| HttpHeader { name: k, value: v })
                .collect::<Vec<HttpHeader>>(),
        ),
    )
    .await?;

    // here we should parse the device Thing Description to get the correct endpoint
    // for now, we assume we already know it since we fetched the device with that capability
    let url = format!("{}/actions/768", input.device_url);

    // same for the body, we should parse the TD to get the correct body structure and format the request accordingly
    let body = format!(
        r#"{{
        "command": {{
            "id": 6,
            "payload": {{
                "0": {},
                "1": 254,
                "2": 0,
                "3": 0,
                "4": 0
            }}
        }}
    }}"#,
        get_hue_from_color(&input.light_color)
    );

    // same for the method
    let method = HttpMethod::POST;

    let device_command = DeviceCommand::new(
        input.device_url,
        CommandHttpArguments {
            url,
            method,
            headers,
            body: Some(body.into()),
        },
        0, // initializing the timestamp to 0 because it's set in the schedule_command function
        user,
        Some(CommandMetadata {
            light_color: input.light_color,
        }),
    );

    STATE.with(|state| {
        state
            .borrow_mut()
            .device_commands
            .schedule_command(device_command)
    });

    Ok(())
}

#[query]
fn get_commands() -> DeviceCommands {
    STATE.with(|state| {
        let state = &state.borrow().device_commands;

        DeviceCommands {
            finished_commands: state
                .finished_commands
                .iter()
                .rev()
                .take(10)
                .map(|(t, c)| (t.clone(), c.clone()))
                .collect(),
            ..state.clone()
        }
    })
}
