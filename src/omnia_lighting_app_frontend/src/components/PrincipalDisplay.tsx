import { Stack, Tag, Text, Tooltip } from "@chakra-ui/react";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../contexts/AuthContext";
import { useMemo } from "react";

type Props = {
    principal: Principal | undefined;
    textLength?: 'short' | 'medium' | 'full';
};

const PrincipalDisplay: React.FC<Props> = ({ principal, textLength }) => {
    const { identity } = useAuth();
    const isCurrentUser = useMemo(() => {
        if (identity === null) {
            return false;
        }

        return principal?.compareTo(identity.getPrincipal()) === 'eq';
    }, [principal, identity]);
    const principalText = useMemo(() => {
        if (!principal) {
            return '';
        }

        // if short, format it to 8 characters in this format: abcd-...-xyz
        if (textLength === 'short') {
            return `${principal.toText().slice(0, 4)}...${principal.toText().slice(-3)}`;
        } else if (textLength === 'medium') {
            return `${principal.toText().slice(0, 8)}...${principal.toText().slice(-8)}`;
        }

        return principal.toText();
    }, [principal, textLength]);

    if (!principal) {
        return null;
    }

    return (
        <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
        >
            <Tooltip hasArrow label={principal.toText()}>
                <Text
                    wordBreak="break-all"
                    whiteSpace="break-spaces"
                >
                    {principalText}
                </Text>
            </Tooltip>
            {isCurrentUser && <Tag>You</Tag>}
        </Stack>
    );
};

export default PrincipalDisplay;
