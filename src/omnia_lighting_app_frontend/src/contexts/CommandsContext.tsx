import { Context, createContext, useCallback, useContext, useEffect, useState } from "react";
import { DeviceCommand } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { omnia_lighting_app_backend } from "../../../declarations/omnia_lighting_app_backend";
import { differenceInMilliseconds } from "date-fns";
import { getDate } from "../utils/timestamp";

export type CommandsContextType = {
    scheduledCommands: [bigint, DeviceCommand][];
    runningCommands: [bigint, DeviceCommand][];
    finishedCommands: [bigint, DeviceCommand][];
    isLoading: boolean;
    fetchCommands: () => Promise<void>;
};

const CommandsContext = createContext<CommandsContextType | null>(null);

type Props = {
    children?: React.ReactNode;
};

export const CommandsProvider: React.FC<Props> = ({ children }) => {
    const [scheduledCommands, setScheduledCommands] = useState<[bigint, DeviceCommand][]>([]);
    const [runningCommands, setRunningCommands] = useState<[bigint, DeviceCommand][]>([]);
    const [finishedCommands, setFinishedCommands] = useState<[bigint, DeviceCommand][]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCommands = useCallback(async () => {
        const commandsResult = await omnia_lighting_app_backend.get_commands();

        setScheduledCommands(commandsResult.scheduled_commands);

        const _runningCommands = commandsResult.running_commands;
        const _finishedCommands = commandsResult.finished_commands;
        // move to running commands the commands that were executed in the last 15 seconds
        for (const [ts, cmd] of _finishedCommands) {
            if (differenceInMilliseconds(new Date(), getDate(ts)) < 15_000) {
                _runningCommands.push([ts, cmd]);
                _finishedCommands.splice(_finishedCommands.indexOf([ts, cmd]), 1);
            }
        }

        // add a command from finished commands to running commands just during development
        // _runningCommands.push([_finishedCommands[0].schedule_timestamp, _finishedCommands[0]]);

        setRunningCommands(_runningCommands.reverse());
        setFinishedCommands(_finishedCommands.reverse());
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchCommands().then(() => setIsLoading(false));

        const interval = setInterval(async () => {
            await fetchCommands();
        }, 1000);

        return () => clearInterval(interval);
    }, [fetchCommands]);

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
    const context = useContext(CommandsContext as Context<CommandsContextType>);

    if (context === undefined) {
        throw new Error("useCommands must be used within a CommandsProvider");
    }

    return context;
}

export default CommandsContext;
