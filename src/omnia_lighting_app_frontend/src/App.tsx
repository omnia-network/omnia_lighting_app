import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Center, FormControl, FormLabel, Heading, Input, SimpleGrid, Spinner, VStack } from '@chakra-ui/react';
import { RiLightbulbLine } from "react-icons/ri"
import { omnia_lighting_app_backend } from "../../declarations/omnia_lighting_app_backend";
import { WotDevices } from '../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did';
import CommandsQueue from './components/CommandsQueue';
import ChooseColorModal from './components/ChooseColorModal';

const App = () => {
  const searchParams = useMemo(() => {
    return new URLSearchParams(window.location.search);
  }, [window.location.search]);
  const [envUid, setEnvUid] = useState<string | null>(searchParams.get("env"));
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedDevices, setFetchedDevices] = useState<WotDevices | null>(null);
  const [selectedDeviceUrl, setSelectedDeviceUrl] = useState<string | null>(null);

  const fetchDevices = useCallback(async (environmentUid: string) => {
    try {
      setIsLoading(true);
      const devicesResult = await omnia_lighting_app_backend.get_devices_in_environment(environmentUid);

      setIsLoading(false);

      if ("Ok" in devicesResult) {
        // we reverse the array just to have lights in the right order (from first paired to last paired)
        setFetchedDevices(devicesResult.Ok.reverse());
      } else {
        throw devicesResult.Err;
      }
    } catch (e) {
      setIsLoading(false);
      alert(e);
    }
  }, []);

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

  const handleBackClick = useCallback(() => {
    setFetchedDevices(null);
  }, []);

  useEffect(() => {
    if (envUid) {
      fetchDevices(envUid);
    }
  }, [envUid, fetchDevices]);

  return (
    <Center
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
        {!fetchedDevices
          ? <VStack
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
          : <VStack w="100%" spacing="8">
            <SimpleGrid minChildWidth="10" spacing="4" w="100%">
              {fetchedDevices.map(([deviceUrl, _], index) => (
                <Card align="center">
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
            <CommandsQueue />
            <Button
              variant="outline"
              onClick={handleBackClick}
            >
              Back
            </Button>
          </VStack>
        }
      </VStack>
    </Center>
  )
}

export default App;
