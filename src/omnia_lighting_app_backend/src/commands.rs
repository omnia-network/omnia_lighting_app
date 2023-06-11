use std::collections::BTreeMap;

use candid::{CandidType, Nat, Principal};
use ic_cdk::api::{
    management_canister::http_request::{
        http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext,
    },
    print, time,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{outcalls::transform_device_response, wot::DeviceUrl, STATE};

/// The interval between one command and the other (in nanoseconds)
pub const COMMANDS_INTERVAL: u64 = 15_000_000_000;

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
pub struct CommandHttpArguments {
    /// The URL to send the HTTP request to.
    pub url: String,
    /// The method of HTTP request.
    pub method: HttpMethod,
    /// List of HTTP request headers and their corresponding values.
    pub headers: Vec<HttpHeader>,
    /// Optionally provide request body.
    pub body: Option<Vec<u8>>,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
pub struct CommandMetadata {
    /// The color that has been set for the light in RGB hex format.
    ///
    /// Example: `#ff0000` for red.
    pub light_color: String,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
pub enum CommandStatus {
    Scheduled,
    Running,
    Completed,
    Failed(String),
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
pub struct DeviceCommand {
    pub device_url: DeviceUrl,
    http_arguments: CommandHttpArguments,
    pub schedule_timestamp: u64,
    pub sender: Principal,
    pub metadata: Option<CommandMetadata>,
    pub status: CommandStatus,
}

impl DeviceCommand {
    pub fn new(
        device_url: DeviceUrl,
        http_arguments: CommandHttpArguments,
        schedule_timestamp: u64,
        sender: Principal,
        metadata: Option<CommandMetadata>,
    ) -> Self {
        Self {
            device_url,
            http_arguments,
            schedule_timestamp,
            sender,
            metadata,
            status: CommandStatus::Scheduled,
        }
    }
}

#[derive(Clone, Default, CandidType, Serialize, Deserialize)]
pub struct DeviceCommands {
    pub scheduled_commands: BTreeMap<u64, DeviceCommand>,
    pub running_commands: BTreeMap<u64, DeviceCommand>,
    pub finished_commands: BTreeMap<u64, DeviceCommand>,
}

impl DeviceCommands {
    /// Schedules the next command for the closest timestamp between
    /// now + 15 seconds and last command schedule timestamp + 15 seconds
    pub fn schedule_command(&mut self, mut c: DeviceCommand) {
        let now = time();
        let last_command_ts = self.get_last_command_timestamp();
        if now > last_command_ts {
            c.schedule_timestamp = now + COMMANDS_INTERVAL;
        } else {
            c.schedule_timestamp = last_command_ts + COMMANDS_INTERVAL;
        }

        print(format!("Command scheduled for {}", c.schedule_timestamp));

        self.scheduled_commands
            .entry(c.schedule_timestamp)
            .or_insert(c);
    }

    pub fn get_commands_to_run(&self) -> Vec<DeviceCommand> {
        let current_timestamp = time();

        self.scheduled_commands
            .range(..current_timestamp)
            .map(|(_, v)| v.clone())
            .collect()
    }

    fn get_last_command_timestamp(&self) -> u64 {
        match self.scheduled_commands.last_key_value() {
            Some((k, _)) => *k,
            // if there's no command, now is reasonably the closest time
            None => time(),
        }
    }
}

async fn execute_command(command: &DeviceCommand) {
    print(format!("Executing command: {command:?}"));

    let mut command = command.to_owned();
    command.status = CommandStatus::Running;

    // execute the HTTPS outcall
    let mut request = CanisterHttpRequestArgument {
        url: command.http_arguments.url,
        method: command.http_arguments.method,
        body: command.http_arguments.body,
        max_response_bytes: Some(2048), // 2KB
        transform: Some(TransformContext::new(transform_device_response, vec![])),
        headers: command.http_arguments.headers,
    };

    // the Idempotent-Key is required to avoid flooding the device (hence, the Gateway) with the same call from all the replicas
    request.headers.push(HttpHeader {
        name: String::from("Idempotent-Key"),
        value: Uuid::new_v4().to_string(),
    });

    // toggle the device by sending the request
    match http_request(request).await {
        Ok((response,)) => {
            // needed just to avoid clippy warnings
            #[allow(clippy::cmp_owned)]
            if response.status >= Nat::from(200) && response.status < Nat::from(400) {
                command.status = CommandStatus::Completed;
            } else {
                print(format!(
                    "The http_request resulted into error. Response: {response:?}"
                ));
                command.status = CommandStatus::Failed(format!("Status: {}", response.status));
            }
        }
        Err((r, m)) => {
            print(format!(
                "The http_request resulted into error. RejectionCode: {r:?}, Error: {m}"
            ));

            command.status = CommandStatus::Failed(format!("RejectionCode: {r:?}, Error: {m}"));
        }
    };

    print(format!(
        "Command executed: {:?}",
        command.schedule_timestamp
    ));
}

pub fn commands_interval_callback() {
    ic_cdk::spawn(async move {
        let commands_to_run = STATE.with(|s| {
            let state = s.borrow_mut();
            state.device_commands.get_commands_to_run()
        });

        for command in commands_to_run {
            STATE.with(|s| {
                let mut state = s.borrow_mut();
                state
                    .device_commands
                    .scheduled_commands
                    .remove(&command.schedule_timestamp);

                state
                    .device_commands
                    .running_commands
                    .insert(command.schedule_timestamp, command.clone());
            });

            execute_command(&command).await;

            STATE.with(|s| {
                let mut state = s.borrow_mut();
                state
                    .device_commands
                    .running_commands
                    .remove(&command.schedule_timestamp);

                state
                    .device_commands
                    .finished_commands
                    .insert(command.schedule_timestamp, command)
            });
        }
    });
}
