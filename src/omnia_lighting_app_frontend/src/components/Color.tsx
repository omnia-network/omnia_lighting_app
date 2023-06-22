import { Box, HStack, Text } from "@chakra-ui/react";
import { AvailableLightColors, printLightColor } from "../utils/lightColor";

type Props = {
    color: AvailableLightColors;
};

const Color: React.FC<Props> = ({ color }) => {
    return (
        <HStack>
            <Box
                w="20px"
                h="20px"
                borderRadius="50%"
                bg={color}
            />
            <Text>{printLightColor(color)}</Text>
        </HStack>
    );
};

export default Color;
