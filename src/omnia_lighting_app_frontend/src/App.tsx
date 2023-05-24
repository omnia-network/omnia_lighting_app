import React, { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Center, FormControl, FormLabel, Heading, IconButton, Input, SimpleGrid, Spinner, VStack } from '@chakra-ui/react';
import { RiLightbulbLine } from "react-icons/ri"
import { omnia_lighting_app_backend } from "../../declarations/omnia_lighting_app_backend";
import { WotDevices } from '../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did';

const App = () => {
  const [envUid, setEnvUid] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedDevices, setFetchedDevices] = useState<WotDevices | null>(null);
  const [deviceUrlLoading, setDeviceUrlLoading] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();

    if (envUid) {
      try {
        setIsLoading(true);
        const devicesResult = await omnia_lighting_app_backend.get_devices_in_environment(envUid);

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
    }
  };

  const handleDeviceClick = async (deviceUrl: string) => {
    setDeviceUrlLoading(deviceUrl);

    try {
      const result = await omnia_lighting_app_backend.send_toggle_command_to_device(deviceUrl);
      setDeviceUrlLoading(null);

      if ("Err" in result) {
        throw result.Err;
      }
    } catch (e) {
      setDeviceUrlLoading(null);
      alert(e);
    }
  };

  const handleBackClick = () => {
    setFetchedDevices(null);
  };

  return (
    <Center
      marginBlock="8"
      marginInline="2"
    >
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
                value={envUid}
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
                    <IconButton
                      aria-label="Toggle light"
                      icon={<RiLightbulbLine />}
                      colorScheme="yellow"
                      onClick={() => handleDeviceClick(deviceUrl)}
                      isLoading={deviceUrl === deviceUrlLoading}
                    />
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
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
