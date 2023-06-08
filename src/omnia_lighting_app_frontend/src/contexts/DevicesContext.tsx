import { createContext, useCallback, useContext, useState } from "react";
import { WotDevices } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { omnia_lighting_app_backend } from "../../../declarations/omnia_lighting_app_backend";

export type DevicesContextType = {
    devices: WotDevices | null;
    isLoading: boolean;
    fetchDevices: (environmentUid: string) => Promise<void>;
    resetDevices: () => void;
};

const DevicesContext = createContext<DevicesContextType>({
    devices: null,
    isLoading: false,
    fetchDevices: async () => { },
    resetDevices: () => { },
});

type Props = {
    children?: React.ReactNode;
};

export const DevicesProvider: React.FC<Props> = ({ children }) => {
    const [devices, setDevices] = useState<WotDevices | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDevices = useCallback(async (environmentUid: string) => {
        try {
            setIsLoading(true);
            const devicesResult = await omnia_lighting_app_backend.get_devices_in_environment(environmentUid);

            setIsLoading(false);

            if ("Ok" in devicesResult) {
                // we reverse the array just to have lights in the right order (from first paired to last paired)
                setDevices(devicesResult.Ok.reverse());
            } else {
                throw devicesResult.Err;
            }
        } catch (e) {
            setIsLoading(false);
            alert(e);
        }
    }, []);

    const resetDevices = useCallback(() => {
        setDevices(null);
    }, []);

    return (
        <DevicesContext.Provider
            value={{
                devices,
                isLoading,
                fetchDevices,
                resetDevices,
            }}
        >
            {children}
        </DevicesContext.Provider>
    );
};

export const useDevices = () => {
    const context = useContext(DevicesContext);

    return context;
};
