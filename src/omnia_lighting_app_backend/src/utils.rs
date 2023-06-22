use ic_cdk::print;

/// Accepts 'red', 'green' or 'blue' as string and returns the related hue value
pub fn get_hue_from_color(color: &str) -> u8 {
    match color {
        "red" => 254,
        "green" => 85,
        "blue" => 170,
        _ => {
            print("Color not supported");
            0
        }
    }
}
