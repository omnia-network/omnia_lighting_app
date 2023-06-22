import { useCallback, useMemo, useState } from 'react';
import { Button, Card, CardBody, CardHeader, FormControl, FormLabel, Stack, Heading, Input, HStack, Spinner, Text, VStack, Box, StackDivider } from '@chakra-ui/react';
import { RiLightbulbLine } from "react-icons/ri"
import CommandsQueue from './components/CommandsQueue';
import ChooseColorModal from './components/ChooseColorModal';
import LiveStream from './components/LiveStream';
import { useDevices } from './contexts/DevicesContext';
import { useCommands } from './contexts/CommandsContext';
import { getCardColorScheme } from './utils/lightColor';
import PrincipalDisplay from './components/PrincipalDisplay';

const App = () => {
  const searchParams = useMemo(() => {
    return new URLSearchParams(window.location.search);
  }, []);
  const [envUid, setEnvUid] = useState<string | null>(searchParams.get("env"));
  const [selectedDeviceUrl, setSelectedDeviceUrl] = useState<string | null>(null);
  const [isEnvInputVisible,] = useState<boolean>(!envUid);
  const { devices, isLoading, fetchDevices, resetDevices, getDeviceName } = useDevices();
  const { lastDevicesCommand } = useCommands();

  const handleListDevicesClick = useCallback(async () => {
    if (!envUid) {
      alert("Please enter an environment unique ID");
      return;
    }

    await fetchDevices(envUid);
  }, [envUid, fetchDevices]);

  const handleDeviceClick = useCallback(async (deviceUrl: string) => {
    setSelectedDeviceUrl(deviceUrl);
  }, []);

  const handleDeviceModalClose = useCallback(() => {
    setSelectedDeviceUrl(null);
  }, []);

  return (
    <Box
      marginBlock={8}
      marginInline={{
        base: 4,
        lg: 8
      }
      }
    >
      <ChooseColorModal
        isOpen={selectedDeviceUrl !== null}
        onClose={handleDeviceModalClose}
        deviceUrl={selectedDeviceUrl!}
      />
      <VStack gap={8}>
        <Heading>Omnia Lighting App</Heading>
        {!devices
          ? (
            <VStack
              width={{
                base: "100%",
                sm: "360px",
              }}
              gap={4}
              textAlign="center"
            >
              <Text>
                By clicking on <b>List devices</b>, the application will query the Omnia canister to retrieve the devices it needs.
              </Text>
              {isEnvInputVisible && (
                <FormControl
                  textAlign="center"
                >
                  <FormLabel>Environment unique ID:</FormLabel>
                  <Input
                    value={envUid!}
                    onChange={(e) => setEnvUid(e.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"

                    required
                  />
                </FormControl>
              )}
              <Button
                isLoading={isLoading}
                loadingText="Retrieving devices"
                onClick={handleListDevicesClick}
              >
                {
                  !isLoading ? "List devices" : <Spinner />
                }
              </Button>
            </VStack>
          ) : (
            <VStack
              gap={24}
              width="100%"
            >
              <Stack
                w="100%"
                gap={8}
                direction={{
                  base: "column",
                  lg: "row",
                }}
              >
                <Stack
                  w="100%"
                  alignItems="center"
                  direction={{
                    base: "column",
                    lg: "column-reverse"
                  }}
                  gap={8}
                >
                  <HStack
                    flexGrow={1}
                    width="100%"
                    justifyContent="center"
                    alignItems="flex-start"
                    gap={{
                      base: 2,
                      lg: 16,
                    }}
                  >
                    {devices.map(([deviceUrl,]) => (
                      <Card
                        key={deviceUrl}
                        align="center"
                        backgroundColor={getCardColorScheme(lastDevicesCommand[deviceUrl]?.metadata[0]?.light_color)}
                      >
                        <CardHeader>
                          {getDeviceName(deviceUrl)}
                        </CardHeader>
                        <CardBody
                          textAlign="center"
                        >
                          <Stack divider={<StackDivider />}>
                            <Box>
                              <Button
                                aria-label="Toggle light"
                                leftIcon={<RiLightbulbLine />}
                                onClick={() => handleDeviceClick(deviceUrl)}
                                colorScheme={lastDevicesCommand[deviceUrl]?.metadata[0]?.light_color}
                                marginBottom={2}
                              >
                                Set color
                              </Button>
                            </Box>
                            {lastDevicesCommand[deviceUrl] && (
                              <Box>
                                <Text
                                  fontSize="sm"
                                  fontWeight="bold"
                                  marginBottom={1}
                                >
                                  Last command by:
                                </Text>
                                <PrincipalDisplay principal={lastDevicesCommand[deviceUrl].sender} textLength='short' />
                              </Box>
                            )}
                          </Stack>
                        </CardBody>
                      </Card>
                    ))}
                  </HStack>
                  <LiveStream />
                </Stack>
                <CommandsQueue />
              </Stack>
              <Button
                variant="outline"
                onClick={resetDevices}
              >
                Query devices again
              </Button>
            </VStack>
          )}
      </VStack>
    </Box >
  )
}

export default App;
