import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Radio,
    RadioGroup,
    Stack,
    VStack,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RiLock2Fill } from "react-icons/ri";
import { omnia_lighting_app_backend } from "../../../declarations/omnia_lighting_app_backend";

type Props = {
    isOpen: boolean;
    deviceUrl: string;
    onClose: () => void;
};

enum LightColorEnum {
    Red = "Red",
    Green = "Green",
    Blue = "Blue",
}

const ChooseColorModal: React.FC<Props> = ({ isOpen, deviceUrl, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated, login } = useAuth();

    const handleLoginClick = useCallback(async () => {
        await login();
    }, [login]);

    const handleSubmit: React.FormEventHandler<HTMLDivElement> = useCallback(async (e) => {
        e.preventDefault();

        console.log(e.currentTarget);

        setIsLoading(true);

        try {
            const result = await omnia_lighting_app_backend.schedule_command({
                device_url: deviceUrl,
                light_color: { Red: null },
            });
            setIsLoading(false);

            if ("Err" in result) {
                throw result.Err;
            }
        } catch (e) {
            setIsLoading(false);
            alert(e);
        }
    }, [deviceUrl]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Modal Title</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {isAuthenticated
                        ? (
                            <VStack
                                as='form'
                                onSubmit={handleSubmit}
                            >
                                <RadioGroup defaultValue='1'>
                                    <Stack spacing={4} direction='row'>
                                        <Radio
                                            value={LightColorEnum.Red}
                                            colorScheme='red'
                                        >
                                            Red
                                        </Radio>
                                        <Radio
                                            value={LightColorEnum.Green}
                                            colorScheme='green'
                                        >
                                            Green
                                        </Radio>
                                        <Radio
                                            value={LightColorEnum.Blue}
                                            colorScheme='blue'
                                        >
                                            Blue
                                        </Radio>
                                    </Stack>
                                </RadioGroup>
                                <Button
                                    mt={4}
                                    isLoading={isLoading}
                                    type='submit'
                                >
                                    Send command
                                </Button>
                            </VStack>
                        )
                        : (
                            <Button
                                leftIcon={<RiLock2Fill />}
                                onClick={handleLoginClick}
                            >
                                Login with Internet Identity
                            </Button>
                        )
                    }
                </ModalBody>

                <ModalFooter
                    justifyContent='center'
                    alignItems='center'
                >
                    <Button colorScheme='blue' mr={3} onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
};

export default ChooseColorModal;
