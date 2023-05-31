import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { DeviceCommands } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { omnia_lighting_app_backend } from "../../../declarations/omnia_lighting_app_backend";

const CommandsQueue = () => {
    const [commands, setCommands] = useState<DeviceCommands>();

    useEffect(() => {
        const interval = setInterval(async () => {
            const commandsResult = await omnia_lighting_app_backend.get_commands();

            setCommands(commandsResult);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Box>
            {commands?.scheduled_commands?.map(([scheduledTimestamp, command], _) => (
                <Box key={scheduledTimestamp.toString()}>
                    <Box>{command.sender.toText()}</Box>
                    <Box>{command.device_url}</Box>
                </Box>
            ))}
        </Box>
    );
};

export default CommandsQueue;
