import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Heading, Spinner, Table, TableContainer, Tag, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { DeviceCommand } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { useAuth } from "../contexts/AuthContext";
import { differenceInSeconds, formatISO } from "date-fns";
import Color from "./Color";
import { useCommands } from "../contexts/CommandsContext";
import { getDate } from "../utils/timestamp";
import { AvailableLightColors } from "../utils/lightColor";
import { useDevices } from "../contexts/DevicesContext";

type CommandsRowProps = {
    command: DeviceCommand;
    status: "scheduled" | "running" | "finished";
};

export const CommandsRow: React.FC<CommandsRowProps> = ({ command, status }) => {
    const { identity } = useAuth();
    const isCurrentUser = useMemo(() => {
        if (identity === null) {
            return false;
        }

        return command.sender.compareTo(identity.getPrincipal()) === 'eq';
    }, [command.sender, identity]);
    const scheduleDate = useMemo(() => getDate(command.schedule_timestamp), [command.schedule_timestamp]);
    const { getDeviceName } = useDevices();

    return (
        <Tr>
            <Td>
                {isCurrentUser && <Tag>You</Tag>}
                <Text
                    wordBreak="break-all"
                    whiteSpace="break-spaces"
                >
                    {command.sender.toText()}
                </Text>
            </Td>
            <Td>
                <Tag colorScheme="purple">
                    {getDeviceName(command.device_url)}
                </Tag>
            </Td>
            <Td>
                <Color color={command.metadata[0]?.light_color as AvailableLightColors} />
            </Td>
            {status !== 'running' && (
                <Td>
                    {status === 'scheduled'
                        ? (
                            differenceInSeconds(scheduleDate, new Date()) > 0
                                ? `${differenceInSeconds(scheduleDate, new Date())} seconds`
                                : 'HTTPS outcall...'
                        )
                        : formatISO(scheduleDate)
                    }
                </Td>
            )}
        </Tr>
    );
};

const CommandsQueue = () => {
    const { scheduledCommands, finishedCommands, isLoading } = useCommands();

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
            width='100%'
            paddingInline={4}
        >
            <Box
                width='100%'
            >
                <Heading
                    as='h5'
                >
                    Scheduled commands
                </Heading>
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
                            {scheduledCommands.map(([scheduledTimestamp, command]) => (
                                <CommandsRow
                                    key={`scheduled-${scheduledTimestamp.toString()}`}
                                    command={command}
                                    status='scheduled'
                                />
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>
            <Accordion
                width='100%'
                allowToggle
            >
                <AccordionItem
                    border='none'
                >
                    <AccordionButton paddingLeft={0}>
                        <Heading
                            as='h5'
                            textAlign='left'
                        >
                            Last 10 commands
                        </Heading>
                        <AccordionIcon
                            gap={2}
                            width={6}
                            height={6}
                        />
                    </AccordionButton>
                    <AccordionPanel
                        pb={4}
                        paddingInline={0}
                    >
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
                                            {finishedCommands.map(([executionTimestamp, command]) => (
                                                <CommandsRow
                                                    key={`finished-${executionTimestamp.toString()}`}
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
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </VStack>
    );
};

export default CommandsQueue;
