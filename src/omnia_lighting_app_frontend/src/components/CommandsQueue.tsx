import { Heading, Spinner, Table, TableContainer, Tag, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { DeviceCommand } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { useAuth } from "../contexts/AuthContext";
import { differenceInSeconds, formatISO } from "date-fns";
import Color from "./Color";
import { useCommands } from "../contexts/CommandsContext";
import { getDate } from "../utils/timestamp";

type CommandsRowProps = {
    command: DeviceCommand;
    status: "scheduled" | "running" | "finished";
};

const CommandsRow: React.FC<CommandsRowProps> = ({ command, status }) => {
    const { identity } = useAuth();
    const isCurrentUser = useMemo(() => {
        if (identity === null) {
            return false;
        }

        return command.sender.compareTo(identity.getPrincipal()) === 'eq';
    }, [command.sender, identity]);
    const scheduleDate = useMemo(() => getDate(command.schedule_timestamp), [command.schedule_timestamp]);

    return (
        <Tr>
            <Td>
                <Text>{command.sender.toText()}</Text>
                {isCurrentUser && <Tag>You</Tag>}
            </Td>
            <Td>{command.device_url}</Td>
            <Td>
                <Color color={command.metadata[0]?.light_color} />
            </Td>
            {status !== 'running' && <Td>
                {status === 'scheduled'
                    ? (
                        differenceInSeconds(scheduleDate, new Date()) > 0
                            ? `${differenceInSeconds(scheduleDate, new Date())} seconds`
                            : 'Now'
                    )
                    : formatISO(scheduleDate)
                }
            </Td>}
        </Tr>
    );
};

const CommandsQueue = () => {
    const { scheduledCommands, runningCommands, finishedCommands, isLoading } = useCommands();

    if (isLoading) {
        return (
            <VStack>
                <Spinner />
            </VStack>
        );
    }

    return (
        <VStack
            spacing='6'
            alignItems='flex-start'
        >
            {runningCommands.length > 0
                && (
                    <>
                        <Heading as='h5'>Current command</Heading>
                        <TableContainer>
                            <Table variant='simple'>
                                <Thead>
                                    <Tr>
                                        <Th>Principal</Th>
                                        <Th>Device</Th>
                                        <Th>Color</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {runningCommands.map(([scheduledTimestamp, command], _) => (
                                        <CommandsRow
                                            key={`running-${scheduledTimestamp.toString()}`}
                                            command={command}
                                            status='running'
                                        />
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            <Heading as='h5'>Scheduled commands</Heading>
            {scheduledCommands.length > 0
                ? (
                    <TableContainer>
                        <Table variant='simple'>
                            <Thead>
                                <Tr>
                                    <Th>Principal</Th>
                                    <Th>Device</Th>
                                    <Th>Color</Th>
                                    <Th>Executed in</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {scheduledCommands.map(([scheduledTimestamp, command], _) => (
                                    <CommandsRow
                                        key={`scheduled-${scheduledTimestamp.toString()}`}
                                        command={command}
                                        status='scheduled'
                                    />
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Text>No commands have been scheduled yet.</Text>
                )}
            <Heading as='h5'>Completed commands</Heading>
            {finishedCommands.length > 0
                ? (
                    <TableContainer>
                        <Table variant='simple'>
                            <Thead>
                                <Tr>
                                    <Th>Principal</Th>
                                    <Th>Device</Th>
                                    <Th>Color</Th>
                                    <Th>Executed at</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {finishedCommands.map((command, _) => (
                                    <CommandsRow
                                        key={`finished-${command.schedule_timestamp.toString()}`}
                                        command={command}
                                        status='finished'
                                    />
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                )
                : (
                    <Text>No commands have been executed yet.</Text>
                )}
        </VStack>
    );
};

export default CommandsQueue;
