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
    Tag,
    Text,
    VStack,
    useBreakpointValue,
} from "@chakra-ui/react";
import { CSSProperties, useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RiLock2Fill } from "react-icons/ri";
import { AvailableLightColors } from "../utils/lightColor";
import { useDevices } from "../contexts/DevicesContext";

type Props = {
    isOpen: boolean;
    deviceUrl: string;
    onClose: () => void;
};

const ChooseColorModal: React.FC<Props> = ({ isOpen, deviceUrl, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated, actor, login } = useAuth();
    const [selectedColor, setSelectedColor] = useState<AvailableLightColors | null>('red');
    const { getDeviceName } = useDevices();
    const modalContentStyle = useBreakpointValue<CSSProperties | undefined>({
        base: {
            position: "absolute",
            bottom: 0,
            left: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            width: "100%",
            maxWidth: "100%",
        },
        md: undefined,
    });

    const handleLoginClick = useCallback(async () => {
        await login();
    }, [login]);

    const handleSubmit = useCallback(async () => {
        if (!selectedColor) {
            console.log("No color selected");
            return;
        }

        setIsLoading(true);

        console.log("Submitting command", selectedColor);

        try {
            const result = await actor!.schedule_command({
                device_url: deviceUrl,
                light_color: selectedColor,
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
    }, [deviceUrl, selectedColor, actor, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            isCentered
        >
            <ModalOverlay />
            <ModalContent
                style={modalContentStyle}
            >
                <ModalHeader>
                    Choose a color for
                    <Tag
                        ml="2"
                        verticalAlign="middle"
                        colorScheme="purple"
                    >
                        {getDeviceName(deviceUrl)}
                    </Tag>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody
                    textAlign="center"
                    paddingBlock={8}
                >
                    {isAuthenticated
                        ? (
                            <VStack
                                mb="4"
                                gap={8}
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
