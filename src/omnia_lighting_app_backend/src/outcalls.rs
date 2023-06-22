use candid::Nat;
use ic_cdk::{
    api::{
        management_canister::http_request::{HttpResponse, TransformArgs},
        print,
    },
    query,
};

/// Use this response transformer when parsing a response from the WoT device.
///
/// TODO: move this transformer to the SDK
#[query]
fn transform_device_response(raw: TransformArgs) -> HttpResponse {
    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        ..Default::default()
    };
    #[allow(clippy::cmp_owned)]
    if res.status >= Nat::from(200) && res.status < Nat::from(400) {
        // TODO: parse the response. For now the status is enough.
        res.body = vec![];
    } else if res.status == Nat::from(401) {
        // this is the case when the access key is invalid
        // the caller needs to request a new access key, so we have to pass the request to caller
        print(format!(
            "transform_device_response: Received 401 from HTTPS outcall: body: {}",
            String::from_utf8(raw.response.body).expect("Failed to parse the response body"),
        ));

        res.body = vec![];
    } else {
        print(format!(
            "transform_device_response: Received an error from HTTPS outcall: status: {}, body: {}",
            raw.response.status,
            String::from_utf8(raw.response.body).expect("Failed to parse the response body"),
        ));
    }
    res
}
