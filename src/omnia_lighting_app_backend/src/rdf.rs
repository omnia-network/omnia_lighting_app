use std::collections::BTreeMap;

use ic_cdk::api::call::call;
use omnia_core_sdk::utils::get_omnia_backend_canister_id;
use serde::{Deserialize, Serialize};

use crate::wot::{DeviceHeaders, WotDevices};

pub type GenericError = String;

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
struct RdfQueryHead {
    vars: Vec<String>,
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
struct RdfQueryGenericBindingContent {
    r#type: String,
    value: String,
}

type RdfQueryGenericBinding = BTreeMap<String, RdfQueryGenericBindingContent>;

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
struct RdfQueryResults {
    bindings: Vec<RdfQueryGenericBinding>,
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
struct RdfQueryResult {
    head: RdfQueryHead,
    results: RdfQueryResults,
}

/// RDF database graph prefixes:
/// - **omnia**: <http://rdf.omnia-iot.com#>
/// - **rdf**: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
/// - **saref**: <https://saref.etsi.org/core/>
/// - **bot**: <https://w3id.org/bot#>
/// - **http**: <https://www.w3.org/2011/http#>
/// - **urn**: `<urn:>`
///
/// TODO: import them from omnia_backend
const PREFIXES: &str = r#"
# Omnia
PREFIX omnia: <http://rdf.omnia-iot.com#>
# Third parties
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX saref: <https://saref.etsi.org/core/>
PREFIX bot: <https://w3id.org/bot#>
PREFIX http: <https://www.w3.org/2011/http#>
PREFIX td: <https://www.w3.org/2019/wot/td#>
# Definitions
PREFIX urn: <urn:>
"#;

fn build_query(q: &str) -> String {
    let mut query = String::from(PREFIXES);
    query.push_str(q);
    query
}

/// Send query to RDF database using the HTTP outcall.
pub async fn send_query(q: String) -> Result<WotDevices, GenericError> {
    let sparql_query = build_query(&q);

    let (rdf_db_query_result,): (Result<Vec<u8>, GenericError>,) = call(
        get_omnia_backend_canister_id(),
        "executeRdfDbQueryAsUpdate",
        (sparql_query,),
    )
    .await
    .map_err(|e| format!("Rejection code: {:?}, error {}", e.0, e.1))?;

    match rdf_db_query_result {
        Ok(result) => parse_rdf_json_response(result),
        Err(err) => Err(err),
    }
}

/// Parse the RDF JSON response into a map of device URLs and their headers.
///
/// NOTE: this is specific to the RDF database query for devices.
pub fn parse_rdf_json_response(body: Vec<u8>) -> Result<WotDevices, String> {
    let json = serde_json::from_slice::<RdfQueryResult>(&body).map_err(|e| e.to_string())?;
    let mut r: WotDevices = BTreeMap::new();

    for binding in json.results.bindings {
        // TODO: handle unwraps
        let device_url = binding.get("device").unwrap().value.clone();
        let header_name = binding.get("headerName").unwrap().value.clone();
        let header_value = binding.get("headerValue").unwrap().value.clone();

        r.entry(device_url)
            .and_modify(|e| {
                e.headers.insert(header_name.clone(), header_value.clone());
            })
            .or_insert(DeviceHeaders {
                headers: BTreeMap::from([(header_name, header_value)]),
            });
    }

    Ok(r)
}
