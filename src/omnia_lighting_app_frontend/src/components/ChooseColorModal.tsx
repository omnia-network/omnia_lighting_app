import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Radio,
    RadioGroup,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RiLock2Fill } from "react-icons/ri";
import { AvailableLightColors, getLightColorEnum } from "../utils/lightColor";

type Props = {
    isOpen: boolean;
    deviceUrl: string;
    onClose: () => void;
};

const ChooseColorModal: React.FC<Props> = ({ isOpen, deviceUrl, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated, actor, login } = useAuth();
    const [selectedColor, setSelectedColor] = useState<AvailableLightColors | null>('red');

    const handleLoginClick = useCallback(async () => {
        await login();
    }, [login]);

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);

        console.log("Submitting command", getLightColorEnum(selectedColor!));

        try {
            const result = await actor!.schedule_command({
                device_url: deviceUrl,
                light_color: getLightColorEnum(selectedColor!),
            });
            setIsLoading(false);

            if ("Err" in result) {
                throw result.Err;
            }

            onClose();
        } catch (e) {
            setIsLoading(false);
            alert(e);
        }
    }, [deviceUrl]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Choose a color</ModalHeader>
                <ModalCloseButton />
                <ModalBody
                    textAlign="center"
                >
                    {isAuthenticated
                        ? (
                            <VStack
                                mb="4"
                                spacing={4}
                            >
                                <RadioGroup
                                    value={selectedColor!}
                                    onChange={(value) => setSelectedColor(value as AvailableLightColors)}
                                >
                                    <Stack
                                        spacing={4}
                                        direction='row'
                                        fontWeight="bold"
                                    >
                                        <Radio
                                            value='red'
                                            colorScheme='red'
                                            color='red'
                                        >
                                            <Text color='red'>RED</Text>
                                        </Radio>
                                        <Radio
                                            value='green'
                                            colorScheme='green'
                                        >
                                            <Text color='green'>GREEN</Text>
                                        </Radio>
                                        <Radio
                                            value='blue'
                                            colorScheme='blue'
                                            color='blue'
                                        >
                                            <Text color='blue'>BLUE</Text>
                                        </Radio>
                                    </Stack>
                                </RadioGroup>
                                <Button
                                    mt={4}
                                    isLoading={isLoading}
                                    onClick={handleSubmit}
                                    colorScheme="blue"
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
            </ModalContent>
        </Modal>
    )
};

export default ChooseColorModal;
