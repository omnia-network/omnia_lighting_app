use candid::Nat;
use ic_cdk::{
    api::{
        management_canister::http_request::{HttpResponse, TransformArgs},
        print,
    },
    query,
};

/// Use this response transformer when parsing a response from the WoT device.
#[query]
pub fn transform_device_response(raw: TransformArgs) -> HttpResponse {
    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        ..Default::default()
    };
    #[allow(clippy::cmp_owned)]
    if res.status >= Nat::from(200) && res.status < Nat::from(400) {
        // TODO: parse the response. For now the status is enough.
        res.body = vec![];
    } else {
        print(format!(
            "transform_device_response: Received an error from HTTPS outcall: err = {:?}",
            raw
        ));
    }
    res
}
