import { Principal } from "@dfinity/principal";
import { getAuthClient } from "../services/authClient";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AuthContextType = {
    isLoading: boolean;
    principal: Principal | null;
    isAuthenticated: boolean;
    login: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    isLoading: false,
    principal: null,
    isAuthenticated: false,
    login: async () => { },
});

type Props = {
    children?: React.ReactNode;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [principal, setPrincipal] = useState<Principal | null>(null);

    const login = useCallback(async () => {
        setIsLoading(true);

        const authClient = await getAuthClient();
        authClient.login({
            async onSuccess() {
                console.log("Login success");

                const principal = authClient.getIdentity().getPrincipal();
                setPrincipal(principal);
                setIsLoading(false);
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
                const principal = authClient.getIdentity().getPrincipal();
                setPrincipal(principal);
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
                principal,
                isAuthenticated: principal !== null,
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
