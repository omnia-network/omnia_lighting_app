import { Text, Heading, VStack, Tag, HStack } from "@chakra-ui/react";
import ReactPlayer from "react-player";
import { useCommands } from "../contexts/CommandsContext";
import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import Color from "./Color";
import { AvailableLightColors } from "../utils/lightColor";

const LiveStream = () => {
    const { runningCommands } = useCommands();
    const { identity } = useAuth();
    const currentCommand = useMemo(() => runningCommands.length > 0 ? runningCommands[0][1] : undefined, [runningCommands]);
    const isCurrentUser = useMemo(() => {
        if (identity === null) {
            return false;
        }

        return currentCommand?.sender.compareTo(identity.getPrincipal()) === 'eq';
    }, [currentCommand?.sender, identity]);

    return (
        <VStack
            gap={2}
        >
            <ReactPlayer
                url={import.meta.env.VITE_LIVE_STREAM_URL}
                playing
                controls
                muted
                playsinline
            />
            <Heading as='h5' fontSize='xs'>Current command</Heading>
            {currentCommand
                ? (
                    <HStack>
                        <Text>{currentCommand.sender.toText()}</Text>
                        {isCurrentUser && <Tag>You</Tag>}
                        <Text>{currentCommand.device_url}</Text>
                        <Text>
                            <Color color={currentCommand.metadata[0]?.light_color as AvailableLightColors} />
                        </Text>
                    </HStack>
                )
                : (
                    <Text>No command is being executed now</Text>
                )}
        </VStack>
    );
};

export default LiveStream;
