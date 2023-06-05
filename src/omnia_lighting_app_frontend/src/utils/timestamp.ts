/**
 * Get a `Date` object from a nanoseconds timestamp
 * @param timestamp timestamp in nanoseconds
 * @returns Date object
 */
export const getDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1_000_000);
};
