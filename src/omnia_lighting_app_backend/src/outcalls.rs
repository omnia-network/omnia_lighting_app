use candid::Nat;
use ic_cdk::{
    api::{
        management_canister::http_request::{HttpResponse, TransformArgs},
        print,
    },
    query,
};

use crate::rdf::parse_rdf_json_response;

/// Use this response transformer when parsing a response from the RDF database.
#[query]
pub fn transform_rdf_response(raw: TransformArgs) -> HttpResponse {
    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        ..Default::default()
    };
    #[allow(clippy::cmp_owned)]
    if res.status >= Nat::from(200) && res.status < Nat::from(400) {
        // TODO: parse body properly
        res.body = parse_rdf_json_response(&raw.response.body);
    } else {
        print(format!(
            "Received an error from HTTPS outcall: err = {:?}",
            raw
        ));
    }
    res
}
