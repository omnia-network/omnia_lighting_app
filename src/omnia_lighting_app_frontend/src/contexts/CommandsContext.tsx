import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DeviceCommands } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { omnia_lighting_app_backend } from "../../../declarations/omnia_lighting_app_backend";

export type CommandsContextType = {
    commands: DeviceCommands;
    refreshCommands: () => Promise<void>;
};

const defaultCommands: DeviceCommands = {
    scheduled_commands: [],
    running_commands: [],
    finished_commands: [],
};

const CommandsContext = createContext<CommandsContextType>({
    commands: defaultCommands,
    refreshCommands: async () => { },
});

type Props = {
    children?: React.ReactNode;
};

export const CommandsProvider: React.FC<Props> = ({ children }) => {
    const [commands, setCommands] = useState<DeviceCommands>(defaultCommands);

    const refreshCommands = useCallback(async () => {
        const commandsResult = await omnia_lighting_app_backend.get_commands();

        setCommands(commandsResult);
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            await refreshCommands();
        }, 1000);

        return () => clearInterval(interval);
    }, [refreshCommands]);

    return (
        <CommandsContext.Provider
            value={{
                commands,
                refreshCommands,
            }}
        >
            {children}
        </CommandsContext.Provider>
    );
};

export const useCommands = () => {
    const context = useContext(CommandsContext);

    if (context === undefined) {
        throw new Error("useCommands must be used within a CommandsProvider");
    }

    return context;
}

export default CommandsContext;
