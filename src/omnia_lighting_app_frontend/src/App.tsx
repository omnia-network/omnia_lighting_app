import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, CardHeader, FormControl, FormLabel, Stack, Heading, Input, SimpleGrid, Spinner, VStack, Box } from '@chakra-ui/react';
import { RiLightbulbLine } from "react-icons/ri"
import CommandsQueue from './components/CommandsQueue';
import ChooseColorModal from './components/ChooseColorModal';
import LiveStream from './components/LiveStream';
import { useDevices } from './contexts/DevicesContext';

const App = () => {
  const searchParams = useMemo(() => {
    return new URLSearchParams(window.location.search);
  }, [window.location.search]);
  const [envUid, setEnvUid] = useState<string | null>(searchParams.get("env"));
  const [selectedDeviceUrl, setSelectedDeviceUrl] = useState<string | null>(null);
  const { devices, isLoading, fetchDevices, resetDevices } = useDevices();

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = useCallback(async (e) => {
    e.preventDefault();

    if (envUid) {
      await fetchDevices(envUid);
    }
  }, [envUid, fetchDevices]);

  const handleDeviceClick = useCallback(async (deviceUrl: string) => {
    setSelectedDeviceUrl(deviceUrl);
  }, []);

  const handleDeviceModalClose = useCallback(() => {
    setSelectedDeviceUrl(null);
  }, []);

  useEffect(() => {
    if (envUid) {
      fetchDevices(envUid);
    }
  }, [envUid, fetchDevices]);

  return (
    <Box
      marginBlock="8"
      marginInline="2"
    >
      <ChooseColorModal
        isOpen={selectedDeviceUrl !== null}
        onClose={handleDeviceModalClose}
        deviceUrl={selectedDeviceUrl!}
      />
      <VStack spacing="6">
        <Heading>Omnia Lighting App</Heading>
        {!devices
          ? (
            <VStack
              as="form"
              w="100%"
              spacing="4"
              onSubmit={handleSubmit}
            >
              <FormControl>
                <FormLabel>Environment unique ID:</FormLabel>
                <Input
                  value={envUid!}
                  onChange={(e) => setEnvUid(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  required
                />
              </FormControl>
              <Button
                type="submit"
                isLoading={isLoading}
                loadingText="Retrieving devices"
              >
                {
                  !isLoading ? "List devices" : <Spinner />
                }
              </Button>
            </VStack>
          ) : (
            <VStack w="100%" spacing="8">
              <Stack
                w="100%"
                alignItems="center"
                justifyContent={["center", "space-between"]}
                direction={["column", "row"]}
              >
                <SimpleGrid minChildWidth="10" spacing="4">
                  {devices.map(([deviceUrl, _], index) => (
                    <Card
                      key={deviceUrl}
                      align="center"
                    >
                      <CardHeader>
                        Light #{index + 1}
                      </CardHeader>
                      <CardBody>
                        <Button
                          aria-label="Toggle light"
                          leftIcon={<RiLightbulbLine />}
                          onClick={() => handleDeviceClick(deviceUrl)}
                        >
                          Set color
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
                <VStack>
                  <LiveStream />
                </VStack>
              </Stack>
              <CommandsQueue />
              <Button
                variant="outline"
                onClick={resetDevices}
              >
                Back
              </Button>
            </VStack>
          )}
      </VStack>
    </Box>
  )
}

export default App;
