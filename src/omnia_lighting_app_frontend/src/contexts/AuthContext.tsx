import { ActorSubclass, Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getAuthClient } from "../services/authClient";
import { canisterId, createActor } from "../../../declarations/omnia_lighting_app_backend";
import { _SERVICE } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";

export type AuthContextType = {
    isLoading: boolean;
    identity: Identity | null;
    isAuthenticated: boolean;
    actor: ActorSubclass<_SERVICE> | null;
    login: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isLoading: false,
    identity: null,
    isAuthenticated: false,
    actor: null,
    login: async () => { },
});

type Props = {
    children?: React.ReactNode;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);

    const loginSuccess = useCallback((authClient: AuthClient) => {
        const identity = authClient.getIdentity();
        setIdentity(identity);

        const authenticatedActor = createActor(canisterId, {
            agentOptions: {
                identity: identity,
            },
        });
        setActor(authenticatedActor);
    }, []);

    const login = useCallback(async () => {
        setIsLoading(true);

        const authClient = await getAuthClient();
        authClient.login({
            async onSuccess() {
                console.log("Login success");
                setIsLoading(false);
                loginSuccess(authClient);
            },
            onError(error) {
                console.log(error);

                setIsLoading(false);
            },
            identityProvider: `http://localhost:4943?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`
        });
    }, []);

    useEffect(() => {
        getAuthClient().then(async (authClient) => {
            console.log("Auth Client initialized");
            const isAuthenticated = await authClient.isAuthenticated();
            if (isAuthenticated) {
                console.log("User is logged in");
                loginSuccess(authClient);
            }
            setIsLoading(false);
        }).catch((e) => {
            console.log("Error initializing auth client", e);
            setIsLoading(false);
        });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isLoading,
                identity,
                isAuthenticated: identity !== null,
                actor,
                login,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within a AuthProvider");
    }

    return context;
}

export default AuthContext;
