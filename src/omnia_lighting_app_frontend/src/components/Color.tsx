import { Box, HStack, Text } from "@chakra-ui/react";
import { parseLightColor } from "../utils/lightColor";
import { LightColorEnum } from "../../../declarations/omnia_lighting_app_backend/omnia_lighting_app_backend.did";
import { useMemo } from "react";

type Props = {
    color: LightColorEnum | undefined;
};

const Color: React.FC<Props> = ({ color }) => {
    const bgColor = useMemo(() => {
        if (color === undefined) {
            return "gray.200";
        }

        return parseLightColor(color);
    }, [color]);

    return (
        <HStack>
            <Box
                w="20px"
                h="20px"
                borderRadius="50%"
                bg={bgColor}
            />
            <Text>{bgColor.toUpperCase()}</Text>
        </HStack>
    );
};

export default Color;
