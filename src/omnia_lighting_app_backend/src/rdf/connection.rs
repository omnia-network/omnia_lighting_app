use ic_cdk::print;

use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(Default, CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RdfDatabaseConnection {
    pub query_url: String,
}

use crate::STATE;

pub fn get_rdf_database_connection() -> RdfDatabaseConnection {
    STATE
        .with(|state| state.borrow().rdf_database_connection.clone())
        .expect("No RDF database connection")
}

pub fn update_rdf_database_connection(rdf_database_query_url: String) {
    let rdf_database_connection = RdfDatabaseConnection {
        query_url: rdf_database_query_url,
    };

    print(format!(
        "RDF Database connection: {:?}",
        rdf_database_connection
    ));

    STATE.with(|state| {
        state.borrow_mut().rdf_database_connection = Some(rdf_database_connection);
    });
}
