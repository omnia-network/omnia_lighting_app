import { Box } from "@chakra-ui/react";
import ReactPlayer from "react-player";

const LiveStream = () => {
    return (
        <Box
            gap={2}
            width={["100%", "auto"]}
        >
            <ReactPlayer
                url={import.meta.env.VITE_LIVE_STREAM_URL}
                playing
                controls
                muted
                playsinline
            />
        </Box>
    );
};

export default LiveStream;
