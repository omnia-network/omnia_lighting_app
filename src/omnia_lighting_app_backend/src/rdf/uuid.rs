use candid::Principal;
use ic_cdk::{call, trap};
use rand::Rng;
use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};
use uuid::{Builder, Uuid};

pub async fn generate_uuid() -> Uuid {
    let mut rng = make_rng().await;

    Builder::from_random_bytes(rng.gen::<[u8; 16]>()).into_uuid()
}

/// Get a random number generator based on 'raw_rand'
///
/// TODO: save the rng in shared state, see https://forum.dfinity.org/t/error-e0432-unresolved-import-rand/12190/29
pub async fn make_rng() -> ChaCha20Rng {
    let raw_rand: Vec<u8> = match call(Principal::management_canister(), "raw_rand", ()).await {
        Ok((res,)) => res,
        Err((_, err)) => trap(&format!("failed to get seed: {}", err)),
    };
    let seed: [u8; 32] = raw_rand[..].try_into().unwrap_or_else(|_| {
                trap(&format!(
                        "when creating seed from raw_rand output, expected raw randomness to be of length 32, got {}",
                        raw_rand.len()
                        ));
            });

    ChaCha20Rng::from_seed(seed)
}
