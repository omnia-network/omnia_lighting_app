use candid::CandidType;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Default, Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct DeviceHeaders {
    pub headers: BTreeMap<String, String>,
}

pub type DeviceUrl = String;

pub type WotDevices = BTreeMap<DeviceUrl, DeviceHeaders>;
