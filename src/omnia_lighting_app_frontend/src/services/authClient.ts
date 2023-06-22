import { AuthClient } from "@dfinity/auth-client";

export const getAuthClient = () => {
    return AuthClient.create();
};
