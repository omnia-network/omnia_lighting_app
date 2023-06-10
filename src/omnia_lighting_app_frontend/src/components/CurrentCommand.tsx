import { Box, Heading, TableContainer, Table, Thead, Tr, Th, Tbody } from "@chakra-ui/react";
import { useMemo } from "react";
import { CommandsRow } from "./CommandsQueue";
import { useCommands } from "../contexts/CommandsContext";

const CurrentCommand = () => {
    const { runningCommands } = useCommands();
    const currentCommand = useMemo(() => runningCommands.length > 0 ? runningCommands[0][1] : undefined, [runningCommands]);

    return (
        <Box width="100%" textAlign="center">
            <Heading as='h5' fontSize='md'>Current command</Heading>
            <TableContainer width="100%">
                <Table variant='simple'>
                    <Thead>
                        <Tr>
                            <Th>Principal</Th>
                            <Th>Device</Th>
                            <Th>Color</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {currentCommand && (
                            <CommandsRow
                                key={`running-${currentCommand.schedule_timestamp.toString()}`}
                                command={currentCommand}
                                status='running'
                            />
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CurrentCommand;
