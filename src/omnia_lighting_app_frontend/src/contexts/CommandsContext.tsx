import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DeviceCommand } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { omnia_lighting_app_backend } from "../../../declarations/omnia_lighting_app_backend";
import { differenceInMilliseconds } from "date-fns";
import { getDate } from "../utils/timestamp";

export type CommandsContextType = {
    scheduledCommands: [bigint, DeviceCommand][];
    runningCommands: [bigint, DeviceCommand][];
    finishedCommands: DeviceCommand[];
    isLoading: boolean;
    fetchCommands: () => Promise<void>;
};

const CommandsContext = createContext<CommandsContextType>({
    scheduledCommands: [],
    runningCommands: [],
    finishedCommands: [],
    isLoading: false,
    fetchCommands: async () => { },
});

type Props = {
    children?: React.ReactNode;
};

export const CommandsProvider: React.FC<Props> = ({ children }) => {
    const [scheduledCommands, setScheduledCommands] = useState<[bigint, DeviceCommand][]>([]);
    const [runningCommands, setRunningCommands] = useState<[bigint, DeviceCommand][]>([]);
    const [finishedCommands, setFinishedCommands] = useState<DeviceCommand[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCommands = useCallback(async () => {
        const commandsResult = await omnia_lighting_app_backend.get_commands();

        setScheduledCommands(commandsResult.scheduled_commands);

        const _runningCommands = commandsResult.running_commands;
        const _finishedCommands = commandsResult.finished_commands;
        // move to running commands the commands that were executed in the last 15 seconds
        for (const cmd of _finishedCommands) {
            if (differenceInMilliseconds(new Date(), getDate(cmd.schedule_timestamp)) < 15_000) {
                _runningCommands.push([cmd.schedule_timestamp, cmd]);
                _finishedCommands.splice(_finishedCommands.indexOf(cmd), 1);
            }
        }

        setRunningCommands(_runningCommands.reverse());
        setFinishedCommands(_finishedCommands);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchCommands().then(() => setIsLoading(false));

        const interval = setInterval(async () => {
            await fetchCommands();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <CommandsContext.Provider
            value={{
                scheduledCommands,
                runningCommands,
                finishedCommands,
                isLoading,
                fetchCommands,
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
