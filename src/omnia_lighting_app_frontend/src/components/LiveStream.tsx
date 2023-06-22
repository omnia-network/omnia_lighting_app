import { Box, useBreakpointValue } from "@chakra-ui/react";
import ReactPlayer from "react-player";

const LiveStream = () => {
    const videoMinWidth = useBreakpointValue({
        base: "100%",
        md: "420px",
    });

    return (
        <Box
            width="100%"
        >
            <ReactPlayer
                url={import.meta.env.VITE_LIVE_STREAM_URL}
                playing
                controls
                muted
                playsinline
                width="100%"
                height="auto"
                style={{
                    aspectRatio: "16/9",
                    maxWidth: 640,
                    marginInline: "auto",
                    minWidth: videoMinWidth,
                }}
            />
        </Box>
    );
};

export default LiveStream;
