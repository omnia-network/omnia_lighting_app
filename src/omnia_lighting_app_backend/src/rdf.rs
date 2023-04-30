pub mod connection;
pub mod uuid;

use std::collections::BTreeMap;

use candid::Nat;
use ic_cdk::api::{
    management_canister::http_request::{
        http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext,
    },
    print,
};
use serde::{Deserialize, Serialize};

use crate::outcalls::transform;

use self::{connection::get_rdf_database_connection, uuid::generate_uuid};

pub type GenericError = String;

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct DeviceHeaders {
    headers: BTreeMap<String, String>,
}

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

pub const OMNIA_GRAPH: &str = "omnia:";

/// RDF database graph prefixes:
/// - **omnia**: <http://rdf.omnia-iot.com#>
/// - **rdf**: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
/// - **saref**: <https://saref.etsi.org/core/>
/// - **bot**: <https://w3id.org/bot#>
/// - **http**: <https://www.w3.org/2011/http#>
/// - **urn**: `<urn:>`
/// <br><br>TODO: import them from omnia_backend
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

const MAX_RESPONSE_BYTES: u64 = 2048; // 2KB

fn build_query(q: &str) -> String {
    let mut query = String::from(PREFIXES);
    query.push_str(q);
    query
}

/// Send query to RDF database using the HTTP outcall.
pub async fn send_query(q: String) -> Result<String, GenericError> {
    let rdf_base_url = get_rdf_database_connection().base_url;

    let request_body = build_query(&q);

    let request_headers = vec![
        HttpHeader {
            name: "Host".to_string(),
            // get only the host:port part of the URL
            value: rdf_base_url.split("://").collect::<Vec<&str>>()[1].to_string(),
        },
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "omnia_backend_canister".to_string(),
        },
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/sparql-query".to_string(),
        },
        // the Idempotent-Key is required to avoid flooding the RDF store with the same query from all the replicas
        HttpHeader {
            name: "Idempotent-Key".to_string(),
            value: generate_uuid().await.to_string(),
        },
    ];

    let url = format!("{}/query", rdf_base_url);

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::POST,
        body: Some(request_body.as_bytes().to_vec()),
        max_response_bytes: Some(MAX_RESPONSE_BYTES),
        transform: Some(TransformContext::new(transform, vec![])),
        headers: request_headers,
    };
    match http_request(request).await {
        Ok((response,)) => {
            // needed just to avoid clippy warnings
            #[allow(clippy::cmp_owned)]
            if response.status >= Nat::from(200) && response.status < Nat::from(400) {
                let message =
                    format!("The http_request resulted into success. Response: {response:?}");
                print(message);
                String::from_utf8(response.body).map_err(|e| e.to_string())
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

pub fn parse_rdf_json_response(body: &[u8]) -> Vec<u8> {
    let json = serde_json::from_slice::<RdfQueryResult>(body).unwrap();
    let mut r: BTreeMap<String, DeviceHeaders> = BTreeMap::new();

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

    let mut result = Vec::new();
    let mut serializer = serde_json::Serializer::new(&mut result);
    r.serialize(&mut serializer).unwrap();
    result
}
